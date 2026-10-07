# Rules for every build agent (read fully, then only your brief)

Read first: `CLAUDE.md` (Team rules are mandatory), `docs/design/COMPONENT_GUIDELINES.md`, `docs/design/TOKENS.md`. Read only the docs and code your task needs. Don't re-read large files you've already seen, and don't paste big file dumps into your reasoning. Be token-efficient.

## Your isolated environment (you are in your own git worktree on your own branch)
1. `pnpm install` (the store is shared, so it's fast).
2. Create `.env` in the worktree root by copying `D:\My Projects\picsart-clone\.env`, then override:
   `DATABASE_URL=postgresql://pixelforge:pixelforge@localhost:5432/pixelforge_aN`, `PORT=300N` (N = your agent number).
   Docker infra (Postgres, S3 on :8333) is already running. Don't start or stop containers.
3. DB: `cd packages/db && npx prisma db push && npx prisma generate`, then `pnpm db:seed`. **Never create migration files** (`migrate dev`), because the main thread writes one combined migration after merging.
4. Run the app with `PORT=300N pnpm dev`, and E2E with `PORT=300N npx playwright test <your spec>`. Never use port 3000.

## Deploy target: Vercel (CLAUDE.md "Deploy target", docs/DEPLOY.md)
- No worker, no Redis, no long-lived processes. Background work goes through `apps/web/lib/jobs/run.ts` (`after()`) and must finish within the route's `maxDuration` (≤ 300 s). Crons are a handler in `app/api/cron/[job]/route.ts` plus a schedule in `apps/web/vercel.json` (at most daily).
- Large files go browser → S3 through presigned URLs; never through a function body (4.5 MB limit).

## Machine load (mandatory: the PC powers off under load)
- `pnpm build`, Playwright and full `pnpm test` must run through the lock: `node "D:/My Projects/picsart-clone/.claude/heavy.mjs" <cmd>`. Playwright runs with `--workers=1`.
- Stop your dev server as soon as you're done with it. Never run two dev servers.

## Ownership & conflicts
- Only create or edit the files your brief lists. Shared files you MAY append to (keep the edits small and additive):
  - `packages/db/prisma/schema.prisma`: add your models in a block commented `// ==== <Agent name> ====`; only add fields or relations to existing models, never rename them.
  - `apps/web/i18n/request.ts`: add your namespace to `NAMESPACES`.
  - `apps/web/components/shell/nav-items.ts`: add your nav entries.
  - `.env.example`: document every new env var.
  - `docs/BACKLOG.md`, `docs/ASSUMPTIONS.md`: append only.
- New UI strings go in your own `apps/web/messages/en/<namespace>.json`.
- Don't modify other agents' areas, `components/ui/*` primitives, `globals.css` tokens, or `components/form/*`. If you truly need a change there, make the smallest additive change and mention it in your final report.

## Quality bar (Definition of Done, CLAUDE.md)
- Next.js App Router best practices: RSC by default, thin pages, `loading.tsx`/`error.tsx` per segment (never put `loading.tsx` above an auth-guarded layout), parallel data fetching.
- Every form uses the `components/form/Form*` components with react-hook-form + zod. Every animation uses Framer Motion (`m.*` + `lib/motion.ts` presets). Tokens only. Pill buttons. Accessible.
- Validate every API input with zod, check authz with `requireUser`, and scope every query to the user's workspace. Rate-limit expensive endpoints (`lib/rate-limit.ts` `rateLimit`).
- Honesty: no fake data or social proof. Anything not wired yet must say so in the UI.
- Tests: unit tests for non-trivial logic (Vitest, `*.test.ts` next to the code), plus **one E2E spec** `e2e/<area>.spec.ts` covering your main happy path.
- Before finishing, all of these must pass: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and your E2E spec.

## Finish
Commit on your branch in small conventional commits (end each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`). Don't push and don't merge. Final reply of **at most 15 lines**: what works, what's stubbed and why, the schema models you added, new env vars, shared files you touched, and any known issues.
