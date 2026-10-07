# Progress

## Status: Phase 0 complete. Awaiting approval for Phase 1.

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
- Seed and migrations have **not run against a live DB** because the Docker daemon was off during Phase 0. First Phase 1 task: `pnpm db:up && pnpm db:migrate && pnpm db:seed`.

### Decisions log
| Date | Decision | Ref |
|---|---|---|
| 2026-10-07 | Lean MVP = Phases 1–4, billing stubbed | ASSUMPTIONS |
| 2026-10-07 | API in Next.js route handlers, no separate apps/api | D1 |
| 2026-10-07 | No Turborepo; Biome instead of ESLint+Prettier | D3, D4 |
| 2026-10-07 | Konva for canvas; Better Auth; polling for job status | D6, D8, D11 |
| 2026-10-07 | Prisma 7 (driver adapter `@prisma/adapter-pg`, config in `prisma.config.ts`); pinned 7.x because `latest` resolved to an 8.0 RC | — |
| 2026-10-07 | Worker and `packages/ai` created only when their first real job exists | B-1, B-2 |
