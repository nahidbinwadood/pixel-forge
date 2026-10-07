# PixelForge — Product Requirements Document

Status: Draft v1 (Phase 0) · Owner: PM/Staff Eng · Last updated: 2026-10-07
Related: [FEATURE_MATRIX](FEATURE_MATRIX.md) · [ROADMAP](ROADMAP.md) · [RISKS](RISKS.md) · [ASSUMPTIONS](ASSUMPTIONS.md)

## 1. Vision

PixelForge is a browser-based creative suite where anyone can edit photos, design graphics and use AI tools, starting from a template or a blank canvas, and export a publish-ready visual in minutes without design skills.

**Beta goal (week 12):** a free-tier product where a new visitor can sign up, open a template or upload a photo, edit it, use one AI tool and export, all in a single session.

## 2. Personas

| Persona | Who | Job to be done | What they need from MVP |
|---|---|---|---|
| **Maya, social creator** | 22, posts daily to Instagram/TikTok, phone + laptop | "Make my posts look polished fast" | Size presets, templates, filters, BG remover, AI captions |
| **Sam, small-business owner** | 40, runs a bakery, no design training | "Make a promo flyer this afternoon" | Templates by occasion, text editing, export to PNG/PDF |
| **Priya, marketer** | 30, makes ad and social variants weekly | "Produce on-brand assets quickly" | Templates, AI image gen, AI copy, consistent fonts (brand kit in V2) |
| **Leo, e-commerce seller** | 28, sells on Etsy/Shopify | "Clean product photos on white backgrounds" | BG remover, solid backgrounds, crop presets, high-quality export |

## 3. MVP scope (lean cut = Phases 1–4)

**In scope:** auth (email+password, Google), profile/settings with GDPR export/delete, uploads + My Uploads, the design/photo editor (canvas, layers basic, text/shape/image/sticker, transforms, undo/redo, autosave, crop/resize, adjustments, filters, before/after), export PNG/JPG/WebP/PDF with free-tier watermark, My Designs, template library + use-template flow + admin publishing, stock photos/stickers/fonts libraries, favorites/recents, basic collage, AI Background Remover, AI Image Generator (basic), AI Writer, credit ledger + gating from config, moderation, prompt history, admin basics, feature flags, i18n framework (EN), dark/light theme, PWA shell, basic SEO tool pages, legal pages.

**Billing in MVP is stubbed** (see ASSUMPTIONS D14). Plans, limits and credit costs come from config. Every user is on Free unless an admin assigns a plan. Stripe arrives in Phase 5, after the beta.

## 4. Epics, user stories & acceptance criteria

### E1 — Authentication
- **US1.1** As a visitor, I can sign up with email and password so that my work is saved.
  - Given a valid email and a password meeting the policy (≥ 6 characters with an uppercase letter, a lowercase letter, a number and a special character; enforced on client and server), when I submit, then my account is created, a verification email is sent, and I land on Home signed in.
  - Given an email that already exists, when I submit, then I see a generic "check your email" message (no account enumeration).
- **US1.2** As a visitor, I can continue with Google.
  - Given I approve the Google consent screen, when I am redirected back, then I am signed in, and a new account is created only if none exists for that verified email.
- **US1.3** As a user, I can reset a forgotten password.
  - Given I request a reset, when I open the emailed link within 1 hour, then I can set a new password, and all other sessions are revoked.
- **US1.4** As a user, I can sign out and stay signed in across browser restarts until I do.
  - Given failed logins exceed 5 per 15 minutes per IP+email, then further attempts are rate-limited with a 429 response.

### E2 — Uploads & My Uploads
- **US2.1** As a user, I can upload images by drag and drop, file picker, paste or URL.
  - Given a JPG/PNG/WebP/GIF/HEIC file ≤ 25 MB, when I upload it, then it appears in My Uploads with a thumbnail within 5 s at p95.
  - Given a file whose magic bytes don't match an allowed type, or one over the size limit, then the upload is rejected with a clear message and nothing is stored as an asset.
  - Given a HEIC file, then it is converted to a web-displayable variant.
- **US2.2** As a user, I can delete an upload. When I confirm, it disappears from the library and its storage objects are deleted within 24 h.

### E3 — Editor core
- **US3.1** As a user, I can create a design from a size preset or custom dimensions.
  - Given I pick "Instagram Post", then a 1080×1080 canvas opens, and the editor is interactive in < 3 s on a mid-range laptop.
- **US3.2** As a user, I can add text, shapes, images and stickers, then move, resize, rotate, flip, align, duplicate, lock and delete them.
  - Given a selected object, when I drag a handle, then it transforms in real time at 60 fps with up to ~200 objects on canvas.
  - Given multiple selected objects, when I choose Align → Center, then they align to their shared bounding box.
- **US3.3** As a user, I can manage layers by reordering, hiding, locking, renaming and changing opacity.
- **US3.4** As a user, I can undo and redo every edit with Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z, back to at least 100 steps.
- **US3.5** As a user, my work autosaves.
  - Given an edit, then the design is saved within 3 s of the last change, and the UI shows "Saved".
  - Given the network is offline, then edits are kept locally, "Offline – changes pending" is shown, and the edits sync on reconnect without loss.
  - Given the browser crashes, when I reopen the design, then I recover all edits up to the last local snapshot.
- **US3.6** As a user, I can zoom, pan, toggle a grid and snap to objects or the canvas center.
- **US3.7** As a user, I can use keyboard shortcuts and a right-click context menu for common actions, and every toolbar action is reachable by keyboard.
- **US3.8** As a user, I can set the background to a solid color, a gradient or an image.

### E4 — Photo adjustments & filters
- **US4.1** As a user, I can crop (free or preset ratio), rotate, straighten, flip and resize an image.
- **US4.2** As a user, I can adjust brightness, contrast, saturation, exposure, highlights, shadows, temperature, tint, vibrance, sharpness, blur, vignette and grain with sliders.
  - Given a slider change on an image ≤ 12 MP, then the preview updates within 100 ms.
  - Edits are non-destructive: the original asset is never modified, and the edit stack is stored in the document JSON.
- **US4.3** As a user, I can apply a filter preset with an intensity slider and save my own preset.
  - Given a premium filter on the Free plan, then it shows a premium badge, can be previewed, and export is blocked with an upgrade notice.
- **US4.4** As a user, I can hold a "Compare" button to see the before/after view.

### E5 — Export & watermark
- **US5.1** As a user, I can export to PNG, JPG (with quality setting), WebP or PDF.
  - Given I click Export → PNG, then the file downloads at design resolution within 5 s for a 1080×1080 design.
  - Every export fires `export_completed` or `export_failed` with format and duration.
- **US5.2** As a Free user, my exports carry a small PixelForge watermark. Paid plans export without it, and the plan check is read from config.
- **US5.3** As a Free user, export resolution is capped by plan limits from config.

### E6 — My Designs
- **US6.1** As a user, I see my designs as a grid of thumbnails sorted by last edited, with rename, duplicate, delete and move-to-folder.
  - Given no designs, then an empty state offers "Start from scratch" and "Browse templates".

### E7 — Templates
- **US7.1** As a user, I can browse templates by category, filter by size and style, and search by keyword.
  - Given the query "birthday", then matching templates are returned in < 500 ms at p95.
- **US7.2** As a user, I can preview a template and click "Use template" to open an editable copy in a new design. The original template is never modified.
- **US7.3** As a Free user, premium templates show a badge. I can open them, but premium export is gated.
- **US7.4** As an admin, I can save the current design as a template, assign a category, tags and the free/premium flag, then publish or unpublish it.

### E8 — Libraries
- **US8.1** As a user, I can search stock photos (Unsplash/Pexels) and add them to a design. Attribution metadata is stored on the asset.
- **US8.2** As a user, I can browse and search stickers by category.
- **US8.3** As a user, I can pick from a Google Fonts subset and upload a custom font (TTF/OTF/WOFF2 ≤ 5 MB).
- **US8.4** As a user, I can favorite templates, stickers and photos, and see Recently Used items.
- **US8.5** As a user, I can create a collage from a grid layout and drop photos into cells.

### E9 — AI Background Remover
- **US9.1** As a user, I can select an image and click "Remove background".
  - Given sufficient credits, then credits are reserved, a job runs, and the result replaces the image as a new non-destructive layer within 15 s at p95.
  - Given insufficient credits, then the job is not created and I see the balance plus the next refill date.
  - Given the provider fails, then reserved credits are refunded and I see a retry option. `ai_job_failed` fires.
- **US9.2** As a user, I can refine the mask with restore/erase brushes (basic).

### E10 — AI Image Generator
- **US10.1** As a user, I can enter a prompt, choose a style preset, aspect ratio and variation count (1–4), with an optional negative prompt and seed.
  - Given a prompt that fails moderation, then no job is created, no credits are charged, and a policy message is shown.
  - Given success, then the variations appear with progress feedback, and I can add any of them to my design or uploads.
  - Every output passes the provider safety check before display. Flagged outputs are discarded and refunded.
- **US10.2** As a user, I can see my prompt history and reuse a past prompt.

### E11 — AI Writer
- **US11.1** As a user, I can generate captions, ad copy, slogans or hashtags from a short description, with tone and length options.
  - Given a request, then 3 suggestions return within 8 s at p95, and I can insert one as a text object or copy it.
  - Prompts and outputs pass moderation.

### E12 — Credits & plan gating (stubbed billing)
- **US12.1** As a user, I can see my credit balance, the next refill date and my usage history (ledger).
  - The balance always equals the sum of my ledger entries. Free credits refill monthly by the amount in config.
- **US12.2** As the system, I pre-check and reserve credits before every AI job, capture them on success and refund on failure. Operations are idempotent per job ID.
- **US12.3** As the system, I enforce per-user AI rate limits (config), returning 429 with a retry-after value.

### E13 — Admin basics
- **US13.1** As an admin, I can search users, view plan and credits, assign a plan, grant credits (ledger entry with a reason) and disable an account. Every action is written to the AuditLog.
- **US13.2** As an admin, I can manage template categories, templates, stickers and feature flags.
- **US13.3** As an admin, I can view AI jobs filtered by status, plus a system health panel (DB, Redis, queue depth, worker heartbeat).
- Non-admins receive 403 on every `/admin` route and API.

### E14 — Settings & GDPR
- **US14.1** As a user, I can edit my name and avatar and set language, theme (system/light/dark) and email preferences.
- **US14.2** As a user, I can request a data export and receive a download link (ZIP of JSON + my assets) by email within 24 h.
- **US14.3** As a user, I can delete my account after re-authentication. All personal data and assets are hard-deleted within 30 days. The ledger and audit rows are anonymized, not deleted.
- **US14.4** As an EU visitor, I see a cookie consent banner, and non-essential analytics are off until I consent.

## 5. MoSCoW (MVP = Phases 1–4)

| Must | Should | Could | Won't (this release) |
|---|---|---|---|
| Email+Google auth, password reset | Magic link, TOTP 2FA | Apple/Facebook login | Teams/workspaces with roles |
| Uploads + My Uploads | URL upload, paste | HEIC on all browsers | Video editor |
| Canvas: text/shape/image/sticker, transforms, layers basic | Snap guides, rulers | Curved text, text effect presets | Community/feed/remix |
| Undo/redo, autosave, crash recovery | Before/after compare | Custom filter presets | Stripe billing (Phase 5) |
| Crop/resize + adjustments + filters | Collage maker (grid) | Pattern backgrounds | Brand kit, magic resize, multi-page |
| Export PNG/JPG/WebP/PDF + watermark | Export resolution caps | — | Real-time co-editing |
| Templates browse/search/use + admin publish | Trending, recently used | Color filter on templates | Public API / Editor SDK |
| BG remover, AI image gen, AI writer | Prompt history | Refine brush polish | AI object remove/expand/upscale |
| Credit ledger, gating, moderation, rate limits | Low-credit email | — | Mobile apps |
| Admin: users, credits, templates, flags | System health panel | — | Social scheduler, ads creator |
| Settings, GDPR export/delete, legal pages, cookie consent | SEO tool pages, PWA shell | Onboarding tour | Video background removal |

## 6. Success metrics → analytics events

All events go through `track(event, props)`. Common props: `user_id`, `plan`, `session_id`, `ts`.

| Metric (brief §8) | Definition | Events |
|---|---|---|
| Activation | % of new signups with ≥1 `export_completed` in their first session | `signup_completed`, `export_completed` |
| Editor retention D1/D7/D30 | % of users with `editor_opened` on day N after signup | `editor_opened` |
| Templates used per session | Count of `template_used` / sessions with `editor_opened` | `template_viewed`, `template_used` |
| AI credits consumed per user | Sum of `credits_spent` per active user per month | `ai_job_requested`, `ai_job_completed`, `credits_spent` |
| Free→paid conversion | % of free users with `plan_changed` to paid (instrumented in MVP, meaningful after Phase 5) | `paywall_viewed`, `upgrade_clicked`, `plan_changed` |
| Export success rate | `export_completed` / (`export_completed` + `export_failed`) | `export_started`, `export_completed`, `export_failed` |
| p95 editor load time | p95 of `duration_ms` on `editor_loaded` | `editor_loaded` |
| Job failure rate | `ai_job_failed` / `ai_job_requested` per tool | `ai_job_failed` |
| Support tickets per 1k users | Feedback-form submissions per 1k MAU | `feedback_submitted` |

## 7. Explicitly out of scope for MVP

Video editor and all video AI; community (profiles, feed, likes, comments, follows, remix, challenges); teams, workspaces with roles, share links and co-editing; Stripe subscriptions, checkout, invoices and credit bundles (Phase 5); brand kit, magic resize, multi-page designs, mockups, animation; retouch, brush/clone, selection tools, curves/levels/HSL, masks and blend modes beyond basic opacity; AI tools other than BG remover, image generator and writer; batch editing; business suite (ads creator, scheduler, link-in-bio, logo maker, QR generator); public API and Editor SDK; mobile apps; languages other than English; version history UI (autosave only).

## 8. Open questions
1. Free-tier monthly credit amount and per-tool credit costs: the placeholders in `packages/shared/src/plans.ts` need product sign-off before beta.
2. Is a waitlist or invite gate wanted for the beta, or open signup?
3. Should premium templates and filters exist at beta, given there is no way to pay yet? Recommendation: ship the badges and gating, but grant beta testers Plus via admin.
