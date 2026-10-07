# Progress

## Status: building. A3 + A5 are finishing on `a3-final` / `a5-final`, then wave 2 (A6 + A7, then A8). See `docs/agents/README.md`.

### Vercel deployment (2026-10-07)
- Worker, BullMQ and Redis removed. Jobs run via `after()`, crons via Vercel Cron, rate limits in Postgres (ASSUMPTIONS D-V1…V7). Guide: `docs/DEPLOY.md`.
- Combined migration `20261007100855_wave1_editor_ai_billing` written (A4's `WaitlistEntry`, `Invoice`, `WebhookEvent`). A1 and A2 needed no schema changes.
- Fixed: the CSP allowed only one storage origin, which would have blocked uploads on R2.
- **When merging A3/A5:** replace `@/lib/redis` → `@/lib/rate-limit`, any BullMQ queue → `lib/jobs/run.ts`, and any worker code → `apps/web/lib/jobs`.
- **Not verified:** a real Vercel deploy (no account access from here), plus live R2, Gemini and SMTP.

### Wave 1 (parallel agents)
| Agent | Scope | State |
|---|---|---|
| A1 | Phase 2 core editor | ✅ Merged to main. Lint, typecheck, 55 unit tests, build and `e2e/editor.spec.ts` passed on the branch |
| A2 | Phase 4 AI on Gemini + crons | ✅ Merged. Mock provider verified. **The real Gemini path has never run: there is no key** |
| A4 | Email (SMTP), optional Stripe, `/pricing`, legal/SEO pages, CSP/headers | ✅ Merged. Low-credit email is wired into AI charges at the merge (B-21). **SMTP is untested live** |
| A3 | Phase 3 templates + libraries | ⏸ WIP, 5 commits on branch `worktree-agent-a8c93542c7bd0b08f`. Last commit is an unchecked `wip:`. It was mid-way through debugging a build error |
| A5 | Phases 8 + 9 community + teams | ⏸ WIP, 2 commits on branch `worktree-agent-a30b258b35dae3611`. Last commit is an unchecked `wip:`. It was mid-way through the UI (post-card) |

Merged main (after the Vercel change): lint ✓, typecheck ✓, unit 94/94 ✓, `pnpm build` ✓, migration ✓, E2E 19/19 ✓.

**To resume:**
1. Resume A3 and A5. Either message the agents, or start fresh agents on their branches with RULES.md and their brief.
2. Merge A3, then A5.
3. Write one combined migration, then run `pnpm build` and the full E2E suite.
4. Write the wave 2 briefs (Phase 6, Phase 7, Phase 10).

Load limits apply: 2 agents at most, and heavy commands go through `.claude/heavy.mjs` (README).

### Done (Design redesign, 2026-10-07)
- Aurora Studio design system, form component library, password policy, Framer Motion everywhere, all existing screens redesigned. See `docs/design/CHANGELOG.md`.
- Verified: lint ✓, typecheck ✓, unit 21/21 ✓, build ✓, E2E 7/7 ✓, all screens reviewed at 4 widths × 2 themes.


### Done (Phase 1: Foundation, 2026-10-07)
- **Auth (Better Auth):** email+password (min 10 chars), Google (enabled when env set), magic link, TOTP 2FA with backup codes, password reset (1 h, revokes other sessions), email verification, rate limits (sign-in 5/15 min). Banned and deleted accounts can't start sessions.
- **Accounts:** personal workspace + free plan + 30 credits on signup (one transaction). Settings: profile, theme, change password, 2FA, GDPR export download, delete account (soft delete + session revoke + audit log).
- **Uploads:** presign → direct PUT to S3 → complete → BullMQ → worker. The worker checks magic bytes, re-encodes to strip EXIF/GPS, converts HEIC to JPEG, and writes 400 px + 1600 px WebP variants. Rejected files are deleted and the user gets a toast. Drag-drop, picker, paste, URL (browser-side fetch). Per-plan size and storage quota.
- **App shell:** sidebar + mobile bottom nav, credits badge, user menu, skip link, theme (system/light/dark), landing page, home with CTAs and empty states.
- **Platform:** feature flags (DB + 30 s cache, roles/users/percent rollout, tested), admin (users: role/plan/credit grant/ban; flags; health of DB/Redis/S3/queue; every mutation audit-logged), i18n (next-intl, EN, RTL-ready), PWA manifest + icons, `track()` analytics wrapper.
- **UI kit:** shadcn/ui (radix) on PixelForge ember tokens, light and dark.
- **Infra:** SeaweedFS replaces MinIO (D19). CI now has an E2E job.
- **Verified:** lint ✓, typecheck ✓ (5 packages), unit 17/17 ✓, `next build` ✓, Playwright E2E 7/7 ✓ ×3 consecutive runs (sign-up/out/in, wrong password, upload → thumbnail → delete, fake image rejected with message, non-admin 404, data export, API 401 shape, admin credit grant + flag toggle + health).

### Not verified / known gaps (Phase 1)
- HEIC conversion has no real sample yet (B-9). Google OAuth is untested (no client ID). Real email sending is untested (no Resend key; dev logs links to the console).
- Recurring monthly credit grant, purge of deleted users and cleanup of abandoned uploads are backlogged (B-10, B-11, B-15).
- **Machine note:** `%LOCALAPPDATA%\swc` (inherited from LocalAppData) grants Modify to the `CodexSandboxUsers` group, so swc's native addon refuses to load. We work around it without touching ACLs (D22). Worth reviewing whether that group should have write access to your profile.

### Done (Phase 0, 2026-10-07)
- Kickoff questions answered, see ASSUMPTIONS.md
- Docs: PRD, FEATURE_MATRIX, ARCHITECTURE (+ Mermaid diagrams), DATA_MODEL (+ ER), API_SPEC.yaml (OpenAPI 3.1, passes Redocly lint), ROADMAP, RISKS, TEST_STRATEGY, SECURITY, WIREFRAMES, BACKLOG, CLAUDE.md, PROJECT_BRIEF.md
- Monorepo scaffold: pnpm workspaces, TS strict, Biome, Vitest, GitHub Actions CI, docker-compose (Postgres 17, Redis 7, MinIO with bucket init), `.env.example`
- `packages/shared`: APP_NAME, plans, credit costs (tested)
- `packages/editor-core`: document schema v1 + `migrate()` (tested)
- `packages/db`: full MVP Prisma schema (validated, client generated) + idempotent seed
- `apps/web`: Next.js 16 shell, design tokens, `/api/v1/health`
- Verified: `pnpm lint`, `pnpm typecheck`, `pnpm test` (7/7), `pnpm build` all green

### In progress
None.

### Blocked / not verified
- ~~Seed/migrations not run against a live DB~~: verified in Phase 1 (seed idempotent).

### Decisions log
| Date | Decision | Ref |
|---|---|---|
| 2026-10-07 | Lean MVP = Phases 1–4, billing stubbed | ASSUMPTIONS |
| 2026-10-07 | API in Next.js route handlers, no separate apps/api | D1 |
| 2026-10-07 | No Turborepo; Biome instead of ESLint+Prettier | D3, D4 |
| 2026-10-07 | Konva for canvas; Better Auth; polling for job status | D6, D8, D11 |
| 2026-10-07 | Prisma 7 (driver adapter `@prisma/adapter-pg`, config in `prisma.config.ts`); pinned 7.x because `latest` resolved to an 8.0 RC | — |
| 2026-10-07 | Worker and `packages/ai` created only when their first real job exists | B-1, B-2 |
| 2026-10-07 | Kickoff open questions approved: credit numbers, AI Writer + prompt history in MVP, magic link/2FA in Phase 1, waitlist paywall | PRD |
| 2026-10-07 | Phase 1 decisions D19–D28 (SeaweedFS, S3 checksums, env loading, next-intl w/o plugin, auth rate limits in DB, sync GDPR export, admin via server actions, browser URL import, no SW yet) | ASSUMPTIONS |
