# Security

Scope: MVP (Phases 1–4). Stack per `ASSUMPTIONS.md`: Next.js route handlers (API), BullMQ worker, Postgres, Redis, S3/R2, Better Auth, hosted AI providers, and a billing stub (no Stripe until Phase 5).

## 1. Assets worth protecting
User photos and designs (private by default), account credentials and sessions, the credit balance (it has monetary value), AI provider API keys and spend, admin capabilities, and platform reputation (abusive or illegal generated content).

## 2. Threat model (STRIDE-lite)

| Area | Threat | Control |
|---|---|---|
| **Uploads** | Spoofed type: a polyglot file or an HTML/SVG served as an image runs script | Allowlist of raster types only. The worker checks magic bytes, and any mismatch rejects the file. Every upload is **re-encoded with sharp** (which strips metadata and neutralises polyglots). Objects are served with the stored `Content-Type` + `X-Content-Type-Options: nosniff` + `Content-Disposition` from a separate storage/CDN domain |
| | Malicious SVG (script, external refs) | **SVG uploads are disallowed** in the MVP. Admin-curated SVG stickers are sanitised with DOMPurify (SVG profile) at ingest |
| | Oversized file or decompression bomb | Presigned PUT is bound to the declared `Content-Length` (plan maximum) and `Content-Type`. sharp `limitInputPixels` (e.g. 100 MP), and a worker job timeout |
| | Privacy leak via EXIF/GPS | sharp re-encode drops all metadata by default. Tested |
| | Reading another user's file | Bucket is private. Object keys are `users/{userId}/{assetId}/…`. Reads use short-lived signed URLs issued only after an ownership check. Library and template assets live under a public prefix |
| **AI jobs** | Credit fraud: replays, races, negative balance | Debit is a single DB transaction (`SELECT … FOR UPDATE` on the balance row, then insert the ledger entry). Requires `Idempotency-Key`. Refunds reference the original hold and are applied once (unique constraint) |
| | Cost abuse or provider spend runaway | Per-user and per-IP rate limits, a credit pre-check, a per-plan concurrency cap, a global daily spend circuit breaker (env), and provider timeouts |
| | Harmful prompts or outputs | Moderation flow (§5). Blocked jobs are refunded and logged to the report queue |
| | Prompt injection into the AI Writer | Output is treated as untrusted text: rendered as plain text, never as HTML, and never executed. The system prompt holds no secrets |
| | SSRF via URL import or provider callbacks | URL import (if enabled) resolves through an allowlisted fetcher: http(s) only, blocks private/link-local IP ranges after DNS resolution, size and time caps. Provider webhooks are verified by signature |
| **Auth** | Credential stuffing or brute force | Better Auth rate limiting on `/api/auth/*` + a Redis limiter per IP and per account, generic error messages, optional TOTP 2FA, email verification required before AI use |
| | Session theft | Session cookie is `httpOnly`, `Secure`, `SameSite=Lax`, rotated on sign-in and privilege change. Sessions can be revoked from settings. Strict CSP limits XSS impact |
| | CSRF | SameSite=Lax + an **Origin/Referer check** on every non-GET `/api/v1/*` request (must match `APP_URL`). No state-changing GETs |
| | Account takeover via OAuth | Account linking only when the provider email is verified. Re-auth is required for email change, password change, 2FA disable and account deletion |
| **Admin** | Privilege escalation | `role` is changed only via an admin endpoint and is never accepted from a user-writable payload. `requireRole('admin')` sits in a server-side guard, never in the UI alone. 2FA is mandatory for admins |
| | Insider misuse or undetected changes | Append-only `AuditLog` for every admin mutation (actor, action, target, before/after diff, IP, user agent). Readable by admins and not deletable via the API |
| **Billing stub** | Self-upgrading a plan or minting credits | `planId` and credit grants are writable only by admins (audited). The client never sends prices or costs, and the server reads costs from `plans.ts` |
| | Client-side watermark bypass | Accepted MVP risk (ASSUMPTIONS D13, RISKS R6). Mitigations: max export resolution is still gated server-side for any server-assisted export, and premium template/asset URLs are only signed for entitled users |

## 3. OWASP Top 10 (2021) → controls

| OWASP | Controls |
|---|---|
| A01 Broken Access Control | Every handler resolves the session, then authorises: ownership is enforced in the query (`where: { id, userId }`), so another user's resource returns 404. Role guard for `/admin/*` (matrix §4). Signed URLs only after the ownership check. Tests per handler (TEST_STRATEGY §3) |
| A02 Cryptographic Failures | TLS everywhere (Vercel/Railway/Neon/R2 enforce it), HSTS. Password hashing by Better Auth (scrypt). Secrets are never logged, and PII is minimised in logs |
| A03 Injection | Prisma parameterised queries only. `$queryRaw` only with tagged templates (no `Unsafe`). Full-text search input goes through `websearch_to_tsquery`. React escapes output, `dangerouslySetInnerHTML` is banned by lint (allow-listed exceptions need review) |
| A04 Insecure Design | This threat model, plus credits treated as money (transactional ledger), and idempotent job design |
| A05 Security Misconfiguration | Security headers via `next.config` (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`). Private bucket by default. MinIO default credentials only in local compose |
| A06 Vulnerable Components | Lockfile committed, `pnpm audit --prod` + GitHub Dependabot/`osv-scanner` in CI, Renovate weekly |
| A07 Identification & Auth Failures | Better Auth with rate limits, email verification, TOTP, session rotation, and re-auth for sensitive actions |
| A08 Software & Data Integrity | CI-only deploys from `main`, protected branch, pinned GitHub Action SHAs, no untrusted script tags, provider webhook signatures verified |
| A09 Logging & Monitoring | Structured JSON logs with request ID and user ID (no PII bodies), Sentry for errors, alerts on 5xx rate, auth failure spikes, job failure rate and daily AI spend |
| A10 SSRF | No arbitrary server-side fetches. Stock proxy hits fixed provider hosts. URL import uses the guarded fetcher (§2) |

### Content Security Policy (starting point)
```
default-src 'self';
script-src 'self' 'nonce-{per-request}' 'strict-dynamic';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' blob: data: https://{storage-cdn} https://images.unsplash.com https://images.pexels.com;
connect-src 'self' https://{storage-host} https://*.sentry.io https://*.posthog.com;
worker-src 'self' blob:;
frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';
```
`blob:` and `data:` in `img-src` are needed for canvas and export. Ship it as `Content-Security-Policy-Report-Only` first, then enforce once the reports are clean.

### Validation and rate limits
- **zod at every handler boundary** (body, query, params), using schemas shared from `packages/shared`. Unknown keys are rejected (`.strict()`). The project `document` is validated with the editor-core schema and capped at 5 MB.
- **Rate limits:** Redis sliding window keyed on `userId` (or IP when anonymous) **and** IP. Defaults below, with overrides per plan in `plans.ts`. Exceeding a limit returns 429 with `Retry-After`.

| Bucket | Default |
|---|---|
| Auth (`/api/auth/*`) | 10 / min per IP, 5 failed sign-ins / 15 min per account |
| AI job create | plan `aiJobsPerMinute` (free: 5/min), plus max 2 concurrent jobs |
| Upload presign | 60 / min |
| Stock search | 30 / min |
| General API | 300 / min |

## 4. RBAC matrix (MVP)

Roles: `anonymous`, `user`, `admin`. Workspace roles (owner/admin/editor/viewer) arrive in Phase 9.

| Endpoint group | anonymous | user | admin |
|---|---|---|---|
| `GET /health`, `GET /plans`, `GET /flags` | ✅ | ✅ | ✅ |
| `GET /templates*`, `GET /template-categories` | ✅ (published only) | ✅ | ✅ |
| `POST /templates/{id}/use` | ❌ | ✅ (premium needs entitlement) | ✅ |
| `/me*`, `/projects*`, `/uploads*`, `/assets*`, `/folders*` | ❌ | ✅ own only | ✅ own only (no implicit access to user content) |
| `/stickers`, `/fonts`, `/stock/photos`, `/search`, `/favorites`, `/recents` | ❌ | ✅ | ✅ |
| `/ai/*`, `/credits*` | ❌ | ✅ verified email required for `POST /ai/jobs` | ✅ |
| `/admin/*` | ❌ | ❌ (403) | ✅ + 2FA + audit log |

Admins viewing a user's private content (for example, investigating a report) goes through a dedicated, audited admin view, never through the user-facing endpoints.

## 5. AI moderation flow
```
request → zod → [prompt moderation] → credit hold → queue → provider (with its own safety filter)
        → [output moderation] → store asset → succeeded
any block → status=blocked, refund credits, Report(source=ai_moderation), user sees policy message
```
- **Prompt moderation:** a Claude-based classifier (`packages/ai`, anthropic adapter) plus a fast keyword denylist. Categories: sexual content involving minors (zero tolerance), sexual/nudity, graphic violence, hate, self-harm, and real-person likeness misuse. **Fail-closed**: if moderation is unavailable, the job is rejected (no charge), not run unchecked.
- **Output moderation:** the provider's safety checker is enabled, plus an image classifier on generated outputs before they are stored or shown.
- **Background removal** moderates the source upload only on report, since it is the user's own photo. Uploads go through the same Report pipeline when flagged.
- **Repeat offenders:** 3 blocks in 24 h triggers a temporary AI cooldown, and patterns are surfaced in the admin report queue. CSAM detections are preserved, never shown to reviewers in clear, and reported to NCMEC per legal obligations. The runbook covers this before launch.

## 6. Secrets and configuration
- Secrets come only from environment variables (Vercel/Railway secret stores). `.env.example` documents every variable with fake values. `.env*` files are gitignored except the example.
- Separate credentials per environment (dev, staging, prod). Provider keys are scoped to the minimum (e.g. R2 token limited to one bucket).
- A CI secret scan (`gitleaks`) runs on every PR.
- Rotation: documented per secret, and immediately after any suspected leak or staff change.

## 7. Dependency and supply-chain hygiene
Committed `pnpm-lock.yaml`, `--frozen-lockfile` in CI, `pnpm audit --prod` (high or critical fails the build), Dependabot/Renovate, a minimal dependency policy (see the ponytail rules in `CLAUDE.md`), and pinned GitHub Actions by SHA.

## 8. Data retention and privacy
| Data | Retention |
|---|---|
| Projects, uploads | Until the user deletes them. Trash purges after 30 days |
| Deleted account | Soft-deleted at once (sessions revoked, content hidden), then hard-deleted (DB rows + storage objects) after 30 days |
| AI prompts and outputs | Kept in history until the user deletes them. Blocked-content evidence is kept 90 days for moderation (longer only where the law requires it) |
| Logs | 30 days, no request bodies, IPs truncated after 7 days |
| Audit log | 2 years |
| Data export files | Signed link valid 7 days, object deleted after 7 days |

Users can export their data (`POST /me/export`) and delete their account (`DELETE /me`). The cookie consent banner gates non-essential analytics (PostHog).

## 9. Incident response basics
1. **Detect:** Sentry alerts, error-rate or spend alerts, user reports (security@ address, listed in `/.well-known/security.txt`).
2. **Triage:** classify severity (S1 = data exposure or account takeover at scale; S2 = single-user exposure or spend abuse; S3 = hardening issue).
3. **Contain:** feature-flag kill switch per AI tool and for uploads, revoke sessions globally (rotate the auth secret), rotate the leaked keys, block the abusive account or IP.
4. **Eradicate and recover:** fix, deploy via CI, verify, and restore from Neon point-in-time recovery if data was corrupted.
5. **Notify:** GDPR requires notifying the supervisory authority within 72 h of a personal-data breach. Affected users are notified without undue delay.
6. **Learn:** a blameless postmortem in `docs/incidents/`, with action items added to `BACKLOG.md`.
