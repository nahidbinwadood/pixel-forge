# Test Strategy

Scope: MVP (Phases 1–4). This document says what to test, with which tool, and which CI gates block a merge. See `ASSUMPTIONS.md` D18.

## 1. Pyramid

```
            ┌──────────────┐
            │  E2E (few)   │  Playwright: critical user journeys, real browser
          ┌─┴──────────────┴─┐
          │   Integration    │  Route handlers + Prisma against docker Postgres/Redis/MinIO
        ┌─┴──────────────────┴─┐
        │ Component (moderate) │  Testing Library + jsdom: panels, dialogs, forms
      ┌─┴──────────────────────┴─┐
      │      Unit (many)         │  Vitest: editor-core, shared, ai adapters, worker processors
      └──────────────────────────┘
```

Rule of thumb: put a test at the lowest level that can catch the bug. The editor's document logic is pure TypeScript, so most editor bugs should be caught by unit tests, not E2E.

## 2. Tools

| Tool | Use | Introduced |
|---|---|---|
| **Vitest** | Unit and integration tests in every package; `v8` coverage | Phase 0 |
| **@testing-library/react** + jsdom | React components in `apps/web` | Phase 1 |
| **Playwright** | E2E journeys; later, canvas screenshot comparisons | Phase 1 |
| **MSW** | Mock outbound HTTP (Unsplash/Pexels, Replicate, Anthropic) in unit and component tests | Phase 1 |
| **Mock AI provider** (`packages/ai`, `AI_PROVIDER=mock`) | Deterministic AI outputs in dev, CI and E2E. It never calls a paid API | Phase 0 |
| **docker-compose** services | Real Postgres, Redis and MinIO for integration tests | Phase 0 |

## 3. What to test, per package

### `packages/editor-core` (coverage ≥ 90%)
Pure logic with no DOM, so it is the cheapest place to be thorough.
- **Schema:** zod accepts valid documents and rejects invalid ones (bad IDs, unknown object types, NaN or Infinity transforms, out-of-range opacity).
- **Migrations:** every `vN → vN+1` migration has a fixture test. A golden-file test loads every historical fixture and migrates it to the latest version, and the result must validate.
- **Commands and history:** each command (add, remove, move, transform, reorder, group/ungroup, set property, apply effect) satisfies `undo(do(s)) == s` and `redo(undo(do(s))) == do(s)`. History stays capped and branching truncates the redo stack.
- **Geometry:** bounding boxes under rotation, snapping, align/distribute, and aspect-ratio crop math.
- **Property-based tests** (fast-check) for command sequences: random do/undo/redo sequences never produce an invalid document.

### `packages/shared` (coverage 100% on plan and credit math)
- Plan limits lookup, entitlement checks (`can(user, feature)`), and credit cost per tool.
- Balance math: hold, refund and refill sequences. Balance can never go negative, and a refund is never larger than the hold it reverses.
- Size presets and zod request schemas shared with the API.

### `packages/ai`
- Each adapter maps the capability interface to provider calls correctly (MSW fixtures of real provider responses).
- Error mapping: provider timeout, 4xx, 5xx and safety rejection each map to our error codes.
- The mock provider is deterministic for a given seed.
- Moderation classifier wrapper: blocked, allowed, and fail-closed when the provider is down.

### `packages/db`
- Seed script runs on an empty DB and is idempotent when run twice.
- `prisma validate` and `prisma migrate diff` in CI catch schema drift.

### `apps/web` — API route handlers (integration, against docker Postgres)
Each handler gets, at minimum, an auth test (401), an ownership test (404 on another user's resource), a role test (403 for admin routes), a validation test (400) and a happy-path test. Additional cases:
- **AI jobs:** credit hold and refund on failure, 402 at zero balance, idempotent replay with the same `Idempotency-Key`, 429 when the rate limit is exceeded, and 422 on a blocked prompt.
- **Projects:** a revision conflict returns 409, autosave is idempotent, and soft delete hides the project.
- **Uploads:** disallowed content types and sizes are rejected, and the presigned URL is scoped to the asset key.
- Each test runs inside a transaction that is rolled back, or uses a per-worker schema, so tests stay isolated.

### `apps/web` — components
Left rail panels, properties panel inputs, export dialog (watermark notice for free users), paywall modal, template browser filters. Assert on accessible roles and names (`getByRole`), which also enforces basic a11y.

### `apps/worker`
- Processors with a real Redis and MinIO: thumbnail generation, magic-byte rejection, EXIF stripping (assert that the output has no GPS tag), and AI job lifecycle transitions (`queued → running → succeeded | failed | blocked`) with refund on failure.
- Retry and backoff config, plus idempotency (a processor run twice for the same job writes no duplicate ledger entries or assets).

## 4. E2E journeys (Playwright)
Run against `next start` + worker + docker services + the mock AI provider.
1. Sign up → verify email (dev mail catcher) → land on the dashboard.
2. Start blank Instagram post → add text, shape and image → undo/redo → reload, and autosave has persisted.
3. Upload photo → adjust brightness and apply a filter → before/after toggle → export PNG; a free user gets a watermark notice.
4. Browse templates → filter by category → use template → edit → export.
5. AI background remover on an uploaded photo → credits decrease → result layer appears.
6. AI image generator with zero credits → paywall modal.
7. Admin: create template from project → publish → visible in the browser.
8. Keyboard-only pass through the editor's main controls, plus an `@axe-core/playwright` scan on key pages.

## 5. Visual regression (from Phase 2, after the editor stabilises)
- Playwright screenshots of a fixed set of fixture documents rendered on the canvas (text, shapes, filters, blend), compared with a small pixel tolerance.
- Pin the browser version, fonts and device scale factor so the screenshots are deterministic. Run them only on Linux CI.

## 6. Performance budgets
| Budget | Target | How it is measured |
|---|---|---|
| Editor time-to-interactive | < 3 s on a mid-range laptop profile (4× CPU throttle in CI) | Playwright + `performance.mark` at "canvas ready"; fails CI if p50 of 5 runs exceeds the budget |
| Canvas interaction | ≥ 60 fps while dragging with 200 objects | Scripted bench: load a 200-object fixture, drive a 2 s drag with `requestAnimationFrame` sampling, assert that the p95 frame time is under 16.7 ms. Starts as a nightly job, then becomes a gate once it is stable |
| Marketing pages | Lighthouse ≥ 90 (perf, a11y, best practices, SEO) | Lighthouse CI on preview deploys |
| JS bundle | Editor route ≤ 350 kB gzip initial; heavy tools lazy-loaded | `next build` output check in CI |

## 7. CI gates (GitHub Actions, every PR)
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck` (TypeScript strict, all packages)
3. `pnpm lint` (Biome check, no warnings allowed on changed files)
4. `pnpm test` (Vitest with coverage). Gates: **≥ 70% lines on core** (`editor-core`, `shared`, `ai`, API services), **≥ 90% on editor-core**, **100% on credit/plan modules**
5. Integration tests with Postgres, Redis and MinIO service containers
6. `prisma validate` + migration drift check
7. E2E smoke (journeys 1–3) on every PR, the full suite nightly and before release
8. `pnpm audit --prod` / dependency scan (see SECURITY.md)

A red gate blocks the merge. Flaky tests are quarantined with a linked issue in `BACKLOG.md` and fixed within a week, never silently retried forever.

## 8. Test data and seed
- `packages/db` seed: plans are mirrored from config, plus an admin user, a free user and a pro user (known dev passwords, dev only), template categories, ~20 fixture templates, stickers, a Google Fonts subset and feature flags.
- Editor fixtures live in `packages/editor-core/test/fixtures/` (one per schema version plus the perf fixture).
- Factories (plain functions, no library) build users, projects and assets for integration tests.
- No production data in tests, ever. Stock and AI calls are mocked in CI.
