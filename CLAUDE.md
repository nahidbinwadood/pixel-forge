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
| `pnpm db:up` | Postgres :5432, Redis :6379, MinIO :9000 (console :9001) |
| `pnpm db:migrate` / `pnpm db:seed` | Prisma migrate dev / idempotent seed |
| `pnpm --filter @pixelforge/db generate` | regenerate the Prisma client after schema edits |
| `pnpm dev` | all apps (web → http://localhost:3000) |
| `pnpm check` | biome lint + typecheck (all packages) + vitest |
| `pnpm format` | biome autofix |
| `pnpm build` | production build |

## Folder map
```
apps/web            Next.js: UI + /api/v1 route handlers + Better Auth
apps/worker         BullMQ worker (Phase 1+)
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

## Definition of done
Acceptance criteria are demoable · `pnpm check` and `pnpm build` are green · tests cover new logic · keyboard and screen-reader basics work · responsive · loading, empty, error and paywall states are handled · analytics event added (PRD event names) · PROGRESS.md updated · migration and seed updated · no secrets, no dead code, no unlinked TODOs.
