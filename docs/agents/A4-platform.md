# A4: Email, billing, public site & hardening (roadmap Phases 5 + 11). Agent number N=4

Read `docs/PRD.md` (billing + legal), `docs/SECURITY.md`, `docs/ARCHITECTURE.md` §5, `packages/shared/src/plans.ts`, and `apps/web/lib/{email,auth,account}.ts`.

You own:
- `apps/web/lib/email.ts` + new `apps/web/emails/**`, `apps/web/lib/billing/**`, `apps/web/app/api/v1/billing/**`, `apps/web/app/api/webhooks/**`
- public route group `apps/web/app/(site)/**` (pricing, legal, tools/* SEO pages), `app/sitemap.ts`, `app/robots.ts`
- `apps/web/app/(app)/settings/_components/billing-*`
- `next.config.ts` (security headers only), `apps/web/instrumentation.ts`
- the namespaces `site` and `billing`

Build:
1. **Email over SMTP** with `nodemailer` (env `SMTP_HOST/PORT/SECURE/USER/PASS`, `EMAIL_FROM`; console fallback when `SMTP_HOST` is empty). Keep the `sendEmail` signature.
   - Branded HTML + text templates (React Email or plain TSX → HTML): verify email, magic link, reset password, welcome, low credits, export ready.
   - Wire welcome on signup and low-credits when the balance drops below 5. Coordinate through a small exported helper only; don't edit A2's files.
2. **Billing with Stripe, optional:** with no `STRIPE_SECRET_KEY`, everything degrades to the existing waitlist. With keys:
   - Checkout (monthly/yearly), customer portal, credit bundles.
   - Webhooks with signature verification, idempotent via event id, that update `Subscription.planId/status/periods` and add `purchase` ledger rows.
   - Entitlements helper `getEntitlements(user)` used by gates.
   - Add an `Invoice` model mirror.
3. **Pricing page** `/pricing`: monthly/yearly toggle with a savings pill, a "Most popular" card with an animated gradient border, a comparison table from `plans.ts`, credit bundles and FAQ. CTAs go to Checkout or the waitlist. A **waitlist** form stores emails (model `WaitlistEntry`) and is rate-limited.
4. **Public pages** using the landing's visual system (`components/marketing/*` nav + footer; read-only reuse):
   - legal: `/terms`, `/privacy`, `/cookies`, `/dmca`, `/ai-policy` (real, sensible content for a beta product)
   - `/about`, `/contact` (form → email to `EMAIL_FROM`)
   - SEO tool pages `/tools/photo-editor`, `/tools/background-remover`, `/tools/ai-image-generator`, `/tools/templates`, each with honest status
   - `sitemap.ts`, `robots.ts`, and OG metadata on every page
   - Replace the footer's "soon" items with real links via a minimal edit to `site-footer.tsx`, the only marketing file you may touch.
   - Cookie consent banner (essential-only by default; analytics only after opt-in; gate PostHog `track` on consent).
5. **Hardening:**
   - Security headers (CSP with nonces or a strict allowlist, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
   - Sentry (optional, env `SENTRY_DSN`) via instrumentation.
   - The `/api/v1/health` deep check is admin-only.
6. **E2E** `e2e/site.spec.ts`: pricing renders plans from config, the waitlist submits, legal pages render, sitemap lists them, and security headers are present.
