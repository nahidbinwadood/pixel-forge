# PixelForge — Claude working notes

Product brief: @PROJECT_BRIEF.md · Decisions: @docs/ASSUMPTIONS.md · Status: @docs/PROGRESS.md

## Working agreement
- Work phase by phase (docs/ROADMAP.md). At phase end, run `pnpm check` and `pnpm build`, update PROGRESS.md, then **stop for approval**.
- Never copy Picsart code, branding, copy or assets. Use original or open-licensed content only, and record attribution in `Asset.license`.
- Log new decisions in ASSUMPTIONS.md and progress in PROGRESS.md. A TODO is only allowed if it links to a BACKLOG.md item.
- Make small commits using conventional-commit style (`feat:`, `fix:`, `chore:`, `docs:`).
- Secrets come only from env. Every new variable goes into `.env.example` with a comment.

## Commands
| | |
|---|---|
| `pnpm install` | install (Node ≥22, pnpm 11) |
| `pnpm db:up` | Postgres :5432, Redis :6379, SeaweedFS S3 :8333 (buckets auto-created) |
| `pnpm db:migrate` / `pnpm db:seed` | Prisma migrate dev + generate / idempotent seed |
| `pnpm db:deploy` | apply migrations non-interactively (CI/prod) |
| `pnpm --filter @pixelforge/db generate` | regenerate the Prisma client after schema edits |
| `pnpm dev` | web (http://localhost:3000) + worker |
| `pnpm test:e2e` | Playwright; needs `pnpm db:up`; starts web + worker itself |
| `pnpm check` | biome lint + typecheck (all packages) + vitest |
| `pnpm format` | biome autofix |
| `pnpm build` | production build |

## Folder map
```
apps/web            Next.js: UI + /api/v1 route handlers + Better Auth
apps/worker         BullMQ worker: upload validation (magic bytes), re-encode, thumbnails
packages/db         Prisma schema/client/seed (client generated to packages/db/generated)
packages/shared     APP_NAME, plans/credits config, shared zod schemas
packages/editor-core  document model + migrate(); pure TS, no DOM, ≥90% test coverage
packages/ai         AIProvider + adapters (Phase 4)
docs/               PRD, architecture, API spec, roadmap, risks, security, tests, wireframes
```

## Conventions
- TypeScript strict with `noUncheckedIndexedAccess`. No `any`, and no `!` non-null assertions (Biome enforces this).
- Workspace packages ship TS source (`exports: ./src/index.ts`) with no build step. Next transpiles them through `transpilePackages`.
- Route handlers stay thin: zod-parse the input, call `requireSession`, call a service function, and return the shared error shape (ARCHITECTURE §7).
- Every DB query is scoped to a workspace the user belongs to. Never trust IDs from the client.
- Limits, credit costs and plan features live **only** in `packages/shared/src/plans.ts`.
- The editor document changes only through `editor-core` commands. Bumping the schema version requires a migration plus a test.
- Tests sit next to the code as `*.test.ts`. Run them with Vitest, and add Playwright E2E from Phase 1.
- Biome formats with 2 spaces, double quotes and a 120-column line width.

## Team rules (mandatory for every dev and every Claude session)

### Next.js + React patterns
- **Server Components by default.** Push `"use client"` down to the smallest interactive leaf, and never mark a whole page as a client component.
- **Thin pages.** A `page.tsx` fetches data (in parallel with `Promise.all`, never a waterfall) and composes feature components from `components/<feature>/`. Business logic lives in `lib/` services, hooks and server actions, not in JSX.
- **Every route segment with async data** gets `loading.tsx` (a skeleton matching the final layout) and `error.tsx` (message + retry). Use `notFound()` and `not-found.tsx` for missing entities.
- **React patterns to use:**
  - composition and children over prop drilling
  - compound components for complex widgets (`Tabs`, `Field`)
  - custom hooks for reusable stateful logic (`use-*.ts`)
  - container/presentational split for data vs view
  - providers for cross-cutting state
  - controlled form state through react-hook-form
- **Mutations** go through server actions or `/api/v1` route handlers, validated by the **same zod schema** on client and server (shared in `packages/shared` or next to the feature).
- **Performance:**
  - Heavy client code (editor, charts, QR) loads via `next/dynamic`.
  - Images use `next/image`, except presigned or blob URLs. Fonts use `next/font`.
  - Avoid barrel imports from big libraries.
  - `useMemo`/`memo` only when profiling shows a need. Use `useTransition` for non-urgent updates.
- **Accessibility:** semantic HTML first, a label on every control, `aria-label` on icon-only buttons, visible focus, keyboard reachable, and color never the only signal.

### Forms
- Every form control is its **own component** in `apps/web/components/form/`:
  - text: `FormInput`, `FormPassword`, `FormTextarea`
  - choice: `FormSelect`, `FormCombobox` (searchable), `FormCheckbox`, `FormRadioGroup`
  - other: `FormSwitch`, `FormSlider`, plus new ones as needed
- They are wired to **react-hook-form + zod** (`zodResolver`). Each renders its own label, description, error message and ARIA (`aria-invalid`, `aria-describedby`).
- Feature code never hand-assembles `Label` + `Input` + error text. If a control type is missing, add a `Form*` component first.
- Forms use `<Form>` (from `components/form/form.tsx`) and submit through `form.handleSubmit`. Server errors are mapped back with `form.setError`.

### Password policy
- At least **6 characters**, with **one uppercase, one lowercase, one number and one special character**.
- The single source of truth is `passwordSchema` in `packages/shared/src/password.ts`. It is enforced in the client forms *and* on the server in Better Auth hooks (sign-up, reset, change password).
- Every password field is a `FormPassword`: an eye toggle with an accessible "Show/Hide password" label, plus a live rules checklist on create/change forms.

### Motion (Framer Motion everywhere)
- Use **Framer Motion** (the `motion` package, imported from `motion/react`) for every interactive element and state change:
  - hover/press, enter/exit
  - list add/remove, layout changes, page content
  - dialogs, sheets, popovers, toasts
  - loading → loaded
- Use the shared presets in `apps/web/lib/motion.ts` (springs, eases, durations, variants) and the wrappers in `apps/web/components/motion/`. No ad-hoc timings.
- `MotionProvider` (root layout) sets `MotionConfig reducedMotion="user"` and `LazyMotion`, so use `m.*` components, not `motion.*`, to keep bundles small.
- Animate `transform`/`opacity` only on hot paths. Motion must never block input or delay content (no >300 ms gates on interaction).

### Design system ("Aurora Studio", docs/design/AUDIT.md)
- Every color, radius, shadow, gradient and font comes from tokens in `apps/web/app/globals.css`. No hard-coded hex or arbitrary values in components.
- **Aurora gradient = transformation** (primary CTA, AI actions, before/after, generating states). **Flare gradient = premium only.** Everything else stays calm.
- Fonts: Bricolage Grotesque (display, tight negative tracking), Geist (UI/body), Geist Mono (prompts, numbers, shortcuts). Light is the default theme, and dark must also pass AA.
- Buttons are pills. `default` = solid violet (one primary per view); `aurora` = transformation/AI only; `contrast` = ink pill for secondary CTAs on marketing.
- Preview every new or changed component on `/design-system` (dev only).

## Definition of done
Acceptance criteria are demoable · `pnpm check` and `pnpm build` are green · tests cover new logic · keyboard and screen-reader basics work · responsive · loading, empty, error and paywall states are handled · analytics event added (PRD event names) · PROGRESS.md updated · migration and seed updated · no secrets, no dead code, no unlinked TODOs.

## Gotchas (learned the hard way)
- Never set `NODE_ENV` in `.env`; it breaks `next build`.
- After editing `schema.prisma`, run `pnpm db:migrate` (it also regenerates). A stale client makes Better Auth fail with "schema mismatch".
- On Windows, stopping a backgrounded `pnpm dev` can leave `next` alive on :3000, and Playwright then reuses the stale server. Kill it.
- The S3 client must keep `requestChecksumCalculation: "WHEN_REQUIRED"`, or browser uploads fail with `BadDigest`.
- Don't put `loading.tsx` above a layout that calls `notFound()`/`redirect()` for authorization (e.g. `(app)/admin`). The Suspense boundary starts streaming with HTTP 200 first, which leaks that the route exists. Keep `loading.tsx` per page segment.
- Worktree agents (`isolation: "worktree"`) branch from the **pushed** default branch, not local HEAD. Push first, or tell agents to `git reset --hard <local-main-sha>` before they start.
