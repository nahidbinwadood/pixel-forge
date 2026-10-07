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
| D19 | ⚠ Local S3 is **SeaweedFS**, not MinIO | MinIO stopped publishing public Docker images (pull fails). SeaweedFS is Apache-2.0 and S3-compatible. Prod stays R2 |
| D20 | S3 client uses `requestChecksumCalculation: "WHEN_REQUIRED"` | Newer AWS SDK v3 bakes an empty-body checksum into presigned URLs, so browser PUTs fail with `BadDigest` on SeaweedFS and R2 |
| D21 | One `.env` at repo root. Next scripts run through `dotenv-cli`, the worker through `tsx --env-file` | Next only reads `apps/web/.env*` and resets env in its workers. Never put `NODE_ENV` in `.env` (breaks `next build`) |
| D22 | ⚠ `next-intl` without its Next plugin: the one alias it adds is set by hand in `next.config.ts` | The plugin loads `@swc/core`'s native addon, which refuses to run on this machine (unsafe ACL on `%LOCALAPPDATA%\swc`). Locale comes from a cookie, with no `/en/` URL prefix |
| D23 | Better Auth rate limits stored in Postgres (`RateLimit` table) | Simple at MVP scale. Upgrade path: Redis `secondaryStorage` |
| D24 | Email verification is sent but not required to use the app | PRD US1.1 lands the user signed in. Revisit before community features, where verified identity matters |
| D25 | ⚠ GDPR export is a synchronous `GET /api/v1/me/export`, not a job | Accounts are small. Move to a worker job + emailed link when exports include binaries (B-12) |
| D26 | ⚠ Admin mutations are **server actions** (`lib/admin.ts`), not REST endpoints | Internal UI only. REST admin endpoints stay in API_SPEC for the Phase 10 public API. Admin UI is English-only by design |
| D27 | "Upload from URL" fetches **in the browser** and reuses the normal upload path | No server-side fetch means no SSRF surface. Sites without CORS fail, and the UI says so |
| D29 | Password policy: ≥ 6 chars + upper + lower + number + special (user decision 2026-10-07, replaces ≥ 10 chars). `passwordSchema` in `packages/shared` drives client forms and Better Auth `hooks.before` | Single source of truth, can't be bypassed via the API |
| D30 | All forms use react-hook-form + zod through `components/form/Form*`; Framer Motion (`motion`) for all animation via `lib/motion.ts` | User mandate; see CLAUDE.md Team rules |
| D31 | Redesign v2 (user feedback + references CherryMockup / cherrypdf / Picsart): Bricolage Grotesque replaces Clash Display; **light default**; pill buttons with solid violet primary (aurora reserved for transformation) | User disliked v1; references are light, airy, tight-grotesque |
| D28 | PWA = manifest + icons, no service worker yet | Chromium installs without one. The SW ships with editor offline mode (PRD US3.5) |

## Platform & billing decisions (agent A4, Phases 5 + 11)
| # | Decision | Why |
|---|---|---|
| D-A4-1 | ⚠ Email is **SMTP via `nodemailer`**, not Resend/React Email (supersedes D16's email half) | The wave's only supplied creds are SMTP, not a Resend key. Templates are plain-TSX-shaped HTML built as escaped template strings in `emails/layout.ts`, not JSX via `renderToStaticMarkup` — Next's App Router bundler refuses to import `react-dom/server` anywhere in its module graph, even in a server-only lib three hops from a route handler |
| D-A4-2 | Stripe is fully optional: `stripeEnabled = Boolean(STRIPE_SECRET_KEY)`. Prices are looked up per plan+interval (`STRIPE_PRICE_<PLAN>_<INTERVAL>`) and per credit bundle (`STRIPE_PRICE_CREDITS_<ID>`); a plan/interval with no price configured falls back to the pricing page's waitlist for just that plan, not billing as a whole | Matches the task's framing ("Stripe stays optional and degrades to the waitlist") without an all-or-nothing flag |
| D-A4-3 | Webhook idempotency via a `WebhookEvent(id)` table keyed on the Stripe event id, inserted before processing | Stripe retries deliveries; a unique-constraint failure on the insert means "already handled" |
| D-A4-4 | Credit bundle sizes/prices live in `apps/web/lib/billing/bundles.ts`, not `packages/shared/src/plans.ts` | plans.ts is limits + AI job credit costs only (CLAUDE.md); bundles are a billing-only concept with no other consumer yet (see BACKLOG B-22) |
| D-A4-5 | Pricing-page display prices (`lib/billing/plan-pricing.ts`) are a small local illustrative table, not fetched from the configured Stripe Price objects | Avoids a Stripe API round-trip on every pricing-page render for a beta with no real prices set yet; must be kept in sync by hand once real prices exist (BACKLOG B-18) |
| D-A4-6 | CSP (with a per-request nonce) lives in `apps/web/proxy.ts` alongside the pre-existing sign-in redirect, not a separate `middleware.ts` | Next.js 16 renamed the convention to `proxy.ts` and errors if both files exist — only found by actually running the app, not from reading the docs |
| D-A4-7 | Sentry (`instrumentation.ts`) posts directly to the DSN's envelope HTTP endpoint instead of using `@sentry/nextjs` | That SDK's build-time source-map-upload plugin needs its own auth token and would make `pnpm build` fragile with no Sentry project configured; matches this repo's existing raw-fetch-over-SDK pattern (`lib/analytics.ts` → PostHog) |
| D-A4-8 | `/api/v1/health`'s shallow check (`status: "ok"`) stays public; `?deep=1` requires admin and reports per-dependency status | The shallow form is what Playwright's `webServer.url` and uptime monitors need — it must never require auth. The deep form leaks infra details (bucket name, queue depth) |
| D-A4-9 | Cookie consent (`app/(site)/_components/cookie-consent.tsx`) mounts once in the root layout, and `lib/analytics.ts`'s `track()` checks `localStorage` consent before calling PostHog | Analytics fires from (auth) and (app) pages too (signup, uploads), not just the public site, so the gate has to be global |

## Product assumptions
- English only at launch. Desktop-first editor, and mobile gets browse + light edit only.
- No mobile apps, no video editor, no community and no teams before the beta (Phases 7–9).
- Stock content: Unsplash/Pexels APIs (attribution stored per asset), Google Fonts, and self-made or CC0 stickers. No Picsart assets of any kind.
- Free-tier AI credit refill is **monthly**, and the amount lives in config.
- User content is private by default. Nothing is public until Community (Phase 8).
