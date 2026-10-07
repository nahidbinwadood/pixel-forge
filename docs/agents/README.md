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

## Machine load limits (added after 3 hard power-offs on 2026-10-07)
The host is an i5-13500T with 16 GB RAM, so running 5 agents at once overloaded it.
- Run **2 agents at once** (user decision): A1 + A2, then A3 + A4, then A5. The heavy-command lock keeps peak load to a single build at a time. Running 2 at once still crashed the machine at 13:48: the power was cut instantly, with no bugcheck, which points to the PSU or adapter, or a thermal trip.
- `~/.wslconfig` caps Docker at 3 GB RAM and 2 CPUs. The Windows max processor state is 80%, which also turns off turbo boost.
- Heavy commands (`pnpm build`, Playwright, full `pnpm test`) run through `node .claude/heavy.mjs <cmd>`, a machine-wide lock. Playwright runs with `--workers=1`.
- Don't leave `pnpm dev` running. Stop it as soon as you have finished testing in the browser.

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
