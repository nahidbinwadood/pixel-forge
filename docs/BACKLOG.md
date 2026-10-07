# Backlog

Items deferred out of a phase or referenced by a TODO in code. Format: `B-<n> · <title> · <phase> · <why deferred>`.

- ~~B-1 · Create `apps/worker` with upload processing + thumbnails~~ · done Phase 1
- B-2 · Create `packages/ai` (AIProvider + mock) · Phase 4 · no consumers before AI phase
- ~~B-3 · Playwright E2E setup + first auth flow test~~ · done Phase 1
- B-4 · Template `tsvector` column + GIN index (raw SQL migration) · Phase 3
- B-5 · Server-side watermark/render for exports (closes RISKS R6) · V2
- B-6 · WebGL filter pipeline replacing Konva CPU filters (D7 ceiling) · V2
- B-7 · Turborepo if CI > ~5 min (D3) · when needed
- B-8 · Confirm free-tier credit amount + per-tool costs before beta (PRD open question) · before week 11
- B-9 · Verify HEIC upload with a real iPhone sample (code path exists, untested: no sample file) · before beta
- B-10 · Purge job: hard-delete users 30 days after `deletedAt` (+ their storage objects) · Phase 4 (worker cron)
- B-11 · Cleanup job: delete `pending` assets older than 24 h (presigned but never completed) · Phase 4 (worker cron)
- B-12 · GDPR export as worker job + emailed link, including original files · when exports get large
- B-13 · Configure R2 bucket CORS (PUT/GET from APP_URL) in the deploy runbook · Phase 11
- B-14 · Sentry wiring (web + worker) · Phase 11
- B-15 · Monthly credit grant cron (signup grant exists; recurring grant does not) · Phase 4
- B-16 · Service worker + offline caching · Phase 2 (with editor offline mode)
- B-17 · Wire `sendLowCreditsEmail(userId)` (`apps/web/lib/email.ts`) into the AI job charge path · Phase 4 · the email helper exists and is tested; A2's credit-debit code doesn't exist yet in this branch to call it from
- B-18 · Keep `apps/web/lib/billing/plan-pricing.ts`'s display prices in sync with the real Stripe Price amounts once `STRIPE_PRICE_*` env vars are set for real (or fetch `stripe.prices.retrieve` server-side instead) · Phase 5 rollout
- B-19 · Swap `apps/web/instrumentation.ts`'s dependency-free envelope POST for the real `@sentry/nextjs` SDK once a Sentry project exists · Phase 11 · avoids the SDK's build-time source-map-upload plugin failing with no auth token configured
- B-20 · Real SMTP send is untested in this sandbox (no SMTP_HOST/USER/PASS available here) — verify against the real provider once creds are in `.env` · before beta · console-fallback path and all templates are unit-tested
- B-21 · Dedicated `CONTACT_EMAIL` env var instead of reusing `EMAIL_FROM` as the contact-form inbox (`apps/web/app/(site)/contact/actions.ts`) · when the two addresses need to differ
- B-22 · Move `apps/web/lib/billing/bundles.ts`'s credit-bundle sizes/prices into `packages/shared/src/plans.ts` if a second consumer (admin UI, API) needs them · when needed
