# Build orchestration

The user asked (2026-10-07) to finish the whole project with parallel agents. The user supplies **only** `GEMINI_API_KEY` and SMTP credentials. Every other integration (Stripe, Unsplash, Google OAuth, Sentry, PostHog) is optional: without its key it must degrade honestly and never fake data.

## Wave 1 (parallel, one git worktree per agent)
| Agent | Brief | Scope | Model | Why |
|---|---|---|---|---|
| A1 | [A1-editor.md](A1-editor.md) | Phase 2 core editor | opus | Hardest: canvas engine, history, export |
| A2 | [A2-ai.md](A2-ai.md) | Phase 4 AI on Gemini + crons | opus | Ledger concurrency, provider integration |
| A3 | [A3-templates.md](A3-templates.md) | Phase 3 templates + libraries | sonnet | CRUD + seed + UI |
| A4 | [A4-platform.md](A4-platform.md) | Phases 5 + 11: email, billing, site, hardening | sonnet | Well-specified pages and config |
| A5 | [A5-community.md](A5-community.md) | Phases 8 + 9: community, teams | sonnet | CRUD-heavy; RBAC matrix is tested |

Every agent follows [RULES.md](RULES.md). Ports 3001–3005, databases `pixelforge_a1`…`a5`, Redis DBs 1–5.

## Merge (main session)
1. Merge the branches in this order: A1 → A3 → A2 → A4 → A5. The editor document schema goes first because A3, A2 and A5 depend on it.
2. Resolve conflicts in the `schema.prisma` blocks and the shared append-only files.
3. Write one combined Prisma migration, then run `pnpm check`, `pnpm build` and the full E2E suite.
4. Wire the cross-agent stubs: A5 moderation → `packages/ai`, A2 low-credit email → A4 helper, A3 "Use template" → editor.
5. Update PROGRESS.md, then stop for approval.

## Wave 2 (after wave 1 merges)
Phase 6 (V2 editing + AI expansion) and Phase 7 (video). Briefs are written after the merge, against the real code.

## Sessions
Peer Claude sessions (see `ListAgents`) can take review or verification tasks over `SendMessage`. Build work runs in worktree subagents so that branches stay isolated.
