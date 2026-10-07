# Assumptions & Decisions

Answers from the kickoff (2026-10-07) plus defaults chosen where the brief left room. Change any of these by editing this file and logging it in `PROGRESS.md`.

## Kickoff answers
| Question | Answer |
|---|---|
| Team / timeline | Solo developer + Claude, ~3 months to a public beta |
| AI providers | Hosted APIs (Replicate/fal for image models, Anthropic Claude for text). Local dev uses the mock provider |
| Hosting | Vercel (web) + Railway (worker, Redis) + Neon (Postgres) + Cloudflare R2 (storage/CDN) |
| MVP cut | **Lean: Phases 1–4.** Billing is stubbed: plans and credits come from config and the DB ledger, and Stripe arrives in Phase 5 |

## Stack decisions (deviations from brief §4 are marked ⚠)
| # | Decision | Why |
|---|---|---|
| D1 | ⚠ **No separate `apps/api`.** REST API lives in Next.js route handlers under `/api/v1/*` | Solo dev means one deployable and one auth context instead of two. Handlers stay stateless and thin, calling service functions, so extracting them to a standalone service later is mechanical |
| D2 | `apps/worker` = plain Node + BullMQ (AI jobs, thumbnails, server exports) | Long-running jobs can't live on Vercel functions |
| D3 | ⚠ **No Turborepo**, plain `pnpm -r` scripts | 5 packages don't need a build cache. Add Turbo when CI passes about 5 min |
| D4 | ⚠ **Biome instead of ESLint + Prettier** | One tool and one config, ~100× faster. Swap back if a required ESLint plugin appears |
| D5 | ⚠ Packages: `db`, `shared`, `editor-core`, `ai`. No `packages/ui` or `packages/config` yet | Design tokens + shadcn components live in `apps/web` until a second consumer exists (Editor SDK, V3) |
| D6 | Canvas: **Konva + react-konva** | Declarative React fit, built-in transformer, hit detection, filters, and `toDataURL` export |
| D7 | Photo adjustments: Konva built-in filters (CPU) for MVP | Ceiling: slow on images over about 12 MP. Upgrade path is a WebGL shader pass (V2) behind the same `Effect` model |
| D8 | Auth: **Better Auth** (email+password, Google, magic link, TOTP 2FA plugin, Prisma adapter) | Covers every auth item in the brief without hand-rolled code. Self-hosted, no vendor lock |
| D9 | DB: PostgreSQL + Prisma. Search: Postgres full-text (`tsvector`) | Meilisearch only when FTS relevance or latency falls short |
| D10 | Storage: S3 API (MinIO local, R2 prod). Uploads use presigned PUT, then the worker validates MIME by magic bytes and makes thumbnails with `sharp` | R2 has zero egress fees, which matters for an image-heavy app |
| D11 | Job progress via **polling (TanStack Query, 1–2 s)**, not WebSockets | Vercel can't hold sockets. Move to SSE or a socket service when collaboration (Phase 9) needs it |
| D12 | AI: `AIProvider` capability interfaces in `packages/ai`. Adapters: `mock`, `replicate` (BG removal, text-to-image FLUX), `anthropic` (AI Writer + prompt moderation). Selected by env var | Swap models without touching call sites |
| D13 | Export (MVP) is **client-side**: Konva → PNG/JPG/WebP, `pdf-lib` → PDF. Free-tier watermark applied client-side | Known gap: a determined user can bypass the client watermark. Server-side render for paid quality tiers is in V2 (see RISKS R6) |
| D14 | Billing stub: `packages/shared/src/plans.ts` defines plans, limits and credit costs. The `CreditLedger` table is the balance source of truth. `Subscription.planId` is set by admin until Stripe arrives in Phase 5 | Gating code is real from day one, and only the payment source changes later |
| D15 | Feature flags: `FeatureFlag` DB table + `isEnabled(key, user)` helper. Analytics: `track()` wrapper → PostHog in prod, console in dev | No flag vendor needed at this scale |
| D16 | Email: Resend + React Email. Errors: Sentry. i18n: `next-intl` (EN only, RTL-ready). Theme: CSS variables + `class` strategy | — |
| D17 | Brand: **PixelForge**, set by one constant `APP_NAME` in `packages/shared`. Palette is an "ember" orange accent on neutral ink, deliberately unlike Picsart's purple/pink | — |
| D18 | Tests: Vitest (unit, all packages) now. Playwright added in Phase 1 when the first UI exists | — |

## Product assumptions
- English only at launch. Desktop-first editor, and mobile gets browse + light edit only.
- No mobile apps, no video editor, no community and no teams before the beta (Phases 7–9).
- Stock content: Unsplash/Pexels APIs (attribution stored per asset), Google Fonts, and self-made or CC0 stickers. No Picsart assets of any kind.
- Free-tier AI credit refill is **monthly**, and the amount lives in config.
- User content is private by default. Nothing is public until Community (Phase 8).
