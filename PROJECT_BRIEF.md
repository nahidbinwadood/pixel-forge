# CLAUDE CODE MASTER PROMPT — "PixelForge" (Picsart-style Creative Platform)

> Paste everything below this line into Claude Code. Save it as `PROJECT_BRIEF.md` in the repo root and reference it in `CLAUDE.md`.

---

## 0. ROLE & WORKING AGREEMENT

You are acting as a **Senior Project Manager + Staff Engineer** building an original web-based creative platform inspired by Picsart (photo editing, graphic design, video, AI tools, templates, community). The product name is **PixelForge** (placeholder, easy to rename via one config constant).

**Rules of engagement**
1. **Do not copy** Picsart's code, branding, logo, illustrations, templates, stock content, or copyrighted assets. Build original UI, original copy, and use only open-licensed or self-generated placeholder assets.
2. **Plan before coding.** Your first deliverable is documentation, not code (see Section 9 – Phase 0).
3. Work **phase by phase**. At the end of each phase: run tests/lint/typecheck, summarize what was done, list open questions, and **stop for my approval** before the next phase.
4. Keep a living `docs/PROGRESS.md` (done / in progress / blocked / decisions log) and update it after every meaningful change.
5. Ask me **at most 5 clarifying questions** at the start, only about things that block the architecture. Otherwise make a reasonable assumption, write it in `docs/ASSUMPTIONS.md`, and continue.
6. Commit in small, conventional-commit-style steps (`feat:`, `fix:`, `chore:`, `docs:`).
7. Never hardcode secrets. Use `.env.example` and document every variable.

---

## 1. PRODUCT VISION

A browser-based, all-in-one creative suite where anyone (creators, small businesses, marketers, students) can **edit photos, design graphics, make videos, and use AI tools** from templates or from scratch, then export/share — with a free tier, paid tiers, and a community.

**Target users:** social media creators, small business owners, marketers, casual users, e-commerce sellers.
**Core promise:** "Go from idea to publish-ready visual in minutes, with no design skills."

---

## 2. COMPLETE FEATURE INVENTORY (reference scope)

Priority tags: **[MVP]** = must ship first · **[V2]** = next · **[V3]** = later / stretch

### 2.1 Photo Editor
- Upload (drag & drop, file picker, paste, URL), formats: JPG, PNG, WebP, GIF, HEIC [MVP]
- Crop, rotate, flip, straighten, resize, aspect-ratio presets (1:1, 4:5, 9:16, 16:9, etc.) [MVP]
- Adjustments: brightness, contrast, saturation, exposure, highlights, shadows, temperature, tint, vibrance, sharpness, blur, vignette, grain [MVP]
- Filters / effects library (free + premium), intensity slider, custom presets [MVP]
- Curves / levels / HSL panel [V2]
- Retouch tools: blemish remover, teeth whitening, skin smooth, eye/face tools [V2]
- Brush, eraser, clone/stamp, blur & smudge tools [V2]
- Selection tools: rectangle, ellipse, lasso, magic wand, smart select [V2]
- Layers: add/duplicate/delete/reorder/group/lock/hide, opacity, blend modes, masks, clipping [MVP basic → V2 full]
- Undo/redo history with history panel [MVP]
- Compare before/after [MVP]
- Batch editing (apply same edits to many photos) [V3]
- Non-destructive editing (edit stack stored as JSON) [MVP]

### 2.2 AI Image Tools (all credit-metered)
- **AI Background Remover** (one click, refine brush) [MVP]
- **AI Background Replace / Generate** [V2]
- **AI Object Remover / Magic Eraser** [V2]
- **AI Replace** (select region + prompt) [V2]
- **AI Expand / Outpainting** [V2]
- **AI Upscaler / Enhance / Denoise / Deblur** [V2]
- **AI Image Generator** (text-to-image, style presets, aspect ratio, negative prompt, seed, N variations) [MVP basic]
- **Image-to-image / sketch-to-image** [V3]
- **AI Avatar / Profile picture maker** [V3]
- **AI Style Transfer / Cartoonizer / Anime filter** [V3]
- **AI Colorize / Restore old photos** [V3]
- **AI Sticker Generator, AI Logo Maker, AI Pattern Generator, AI QR Code Art, AI GIF Generator** [V3]
- **AI Writer** (captions, ad copy, slogans, hashtags) [V2]
- **AI Design Assistant** (chat: "make me a summer sale Instagram post") [V3]
- Prompt history, favorites, and "remix this prompt" [V2]
- Content moderation on prompts and outputs (NSFW / unsafe filter) [MVP]

### 2.3 Graphic Design Editor (Canvas)
- Infinite/fixed canvas with zoom, pan, rulers, guides, grid, snap-to-object [MVP]
- Canvas size presets: Instagram post/story/reel, Facebook, YouTube thumbnail, TikTok, LinkedIn, X, Pinterest, Poster, Flyer, Business card, A4, custom [MVP]
- Object types: text, image, shape, line, icon, sticker, frame, QR code, chart [MVP: text/image/shape/sticker]
- Text: font library (Google Fonts + upload custom), size, weight, color, gradient, letter/line spacing, alignment, curved text, shadow, outline, background, text effects presets [MVP basic]
- Shapes library, gradient fills, strokes, corner radius, shadows, opacity [MVP]
- Transform: move, resize, rotate, flip, align, distribute, group/ungroup, lock, duplicate [MVP]
- Stickers/Elements library with search + categories [MVP]
- Background: solid, gradient, image, pattern, video [MVP]
- Brand Kit: logos, colors, fonts per workspace [V2]
- Magic Resize (convert design to multiple sizes) [V2]
- Multi-page designs (carousels, presentations) [V2]
- Collage maker with grid layouts and free layout [MVP basic]
- Mockups (T-shirt, mug, phone, poster) [V3]
- Animated text/elements for designs [V3]
- Keyboard shortcuts and context menu [MVP]
- Autosave + cloud sync + version history [MVP autosave → V2 history]

### 2.4 Template Library
- Categories: social media, business, marketing, education, events, e-commerce, holidays, resumes, YouTube, etc. [MVP]
- Search, filter by size/category/style/color, trending, recently used, favorites [MVP]
- Template preview → "Use template" → opens in editor [MVP]
- Free vs premium templates (paywall badge) [MVP]
- Admin tool to create/publish templates from the editor [MVP internal]
- Creator-submitted templates + remix [V3]

### 2.5 Video Editor
- Upload video/audio, trim, split, merge, speed, reverse, crop, rotate [V2]
- Multi-track timeline (video, image, text, audio, stickers) with scrubbing [V2]
- Transitions, effects, filters, keyframe animation (position/scale/opacity) [V2]
- Text & captions: **auto-captions / speech-to-text**, subtitle styles, translation [V2]
- Music & sound-effects library, volume, fade, voiceover recording [V2]
- Video background remover [V3]
- AI video generation (text/image-to-video), AI video avatar / talking head [V3]
- Video templates, slideshow maker, GIF maker [V2]
- Export: MP4/WebM/GIF, 720p/1080p/4K by plan, aspect-ratio presets [V2]
- Background rendering queue with progress and notifications [V2]

### 2.6 Libraries & Content
- Stock photos, videos, icons, stickers, fonts, music, backgrounds, patterns (licensed/open) [MVP: photos + stickers + fonts]
- Search with filters (orientation, color, type, free/premium) [MVP]
- "My Uploads", "My Designs", "Favorites", "Recently Used", folders/projects [MVP]
- Asset licensing metadata and attribution [MVP]

### 2.7 Community & Social (Picsart's "creator network")
- Public profile (avatar, bio, followers/following, portfolio grid) [V2]
- Publish creation to feed (image/video/template), tags, captions [V2]
- Like, comment, save, share, report [V2]
- Follow creators, personalized feed, explore/trending, hashtags [V2]
- **Remix / "Free to Edit"** — open another creator's public work in the editor [V2]
- Challenges / contests with voting and leaderboards [V3]
- Notifications (in-app + email) [V2]
- Moderation tools: report queue, ban, takedown, DMCA workflow [V2]

### 2.8 Accounts, Workspaces & Collaboration
- Sign up / login: email+password, Google, Apple, Facebook; magic link; email verification; password reset; 2FA [MVP: email + Google]
- Profile & settings (language, theme, notifications, delete account, export data — GDPR) [MVP]
- Teams / workspaces with roles (owner, admin, editor, viewer), invites [V2]
- Share design via link (view/comment/edit), real-time co-editing with cursors [V3]
- Comments on designs, review/approval flow [V3]
- Shared brand kits & shared template libraries [V2]

### 2.9 Business / Ads / E-commerce Tools
- Ad creator for Facebook/Instagram/Google/TikTok sizes, with product feed import [V3]
- Product photo tools: white-background, shadow, studio scene generation [V2]
- Bulk product image processing (batch BG removal + resize) [V3]
- Social scheduler / direct publish (Instagram, Facebook, Pinterest, X, LinkedIn) [V3]
- Link-in-bio / simple landing-page maker [V3]
- Logo maker + brand identity pack [V3]
- QR code generator [V2]

### 2.10 Monetization & Billing
- Plans: **Free**, **Plus**, **Pro**, **Team/Business**, **Enterprise (API/SDK)** — limits defined in config, not hardcoded [MVP]
- Free-tier **AI credits** (monthly/weekly refill), paid credit bundles, credit ledger, usage history [MVP]
- Stripe subscriptions (monthly/yearly), coupons, trials, proration, invoices, tax, cancel/resume, webhooks [MVP]
- Feature gating (premium filters/templates/export quality/watermark) [MVP]
- Watermark on free exports [MVP]
- Commercial-use license flags on assets [MVP]
- Enterprise: **Public REST API + embeddable Editor SDK** (iframe/JS) with API keys, quotas, and usage dashboards [V3]

### 2.11 Platform & Cross-cutting
- Responsive web (desktop-first editor, mobile-friendly browse/view); **PWA** installable [MVP]
- Mobile apps (React Native / Expo) [V3 — out of scope for now]
- i18n (start with EN; framework ready for 10+ languages, RTL support) [MVP framework]
- Accessibility: WCAG 2.1 AA, keyboard nav, ARIA, contrast, reduced-motion [MVP]
- Dark/light theme [MVP]
- Onboarding tour, empty states, in-app help center, feedback widget [V2]
- Search (global): templates, assets, designs, creators [MVP]
- SEO landing pages per tool (e.g. /tools/background-remover), blog, pricing page, programmatic SEO for templates [MVP basic]
- Analytics (product events), A/B testing flags, feature flags [MVP flags]
- Admin dashboard: users, subscriptions, credits, content moderation, templates/assets CMS, feature flags, system health [MVP basic]
- Email system: transactional + lifecycle (welcome, receipt, credit low, export ready) [MVP transactional]
- Legal: Terms, Privacy, Cookie consent, DMCA, content policy, AI usage policy [MVP]

---

## 3. NON-FUNCTIONAL REQUIREMENTS
- **Performance:** editor interactive < 3s on mid-range laptop; 60fps canvas interaction up to ~200 objects; lazy-load heavy tools; Lighthouse ≥ 90 on marketing pages.
- **Scalability:** stateless API, queue-based AI/video jobs, CDN for assets, horizontal scaling ready.
- **Security:** OWASP Top 10, rate limiting, input validation (Zod), signed upload URLs, malware/MIME checks on uploads, CSRF/XSS protection, RBAC, audit logs, secrets management.
- **Privacy:** GDPR/CCPA-ready (consent, data export/delete), user content private by default.
- **Reliability:** autosave every few seconds, crash recovery, idempotent jobs, retries with backoff, health checks.
- **Observability:** structured logging, error tracking (Sentry-compatible), metrics, tracing hooks.
- **Quality:** TypeScript strict mode, ESLint + Prettier, unit tests (Vitest/Jest), component tests, E2E (Playwright), CI pipeline, ≥ 70% coverage on core logic.
- **Cost control:** per-user AI rate limits, credit pre-check before each job, provider abstraction so models can be swapped.

---

## 4. RECOMMENDED TECH STACK (justify or propose changes in Phase 0)

| Layer | Choice |
|---|---|
| Frontend | **Next.js (App Router) + React + TypeScript**, Tailwind CSS, shadcn/ui, Zustand (editor state), TanStack Query |
| Editor engine | **Konva.js / react-konva** or **Fabric.js** for the design canvas; WebGL/WASM (e.g. PixiJS / WebGL shaders) for filters; Web Workers + OffscreenCanvas for heavy ops |
| Video | WebCodecs + ffmpeg.wasm in-browser for light edits; server-side FFmpeg workers for final renders |
| Backend | **Node.js + Express (or NestJS) + TypeScript**, REST + OpenAPI spec, WebSocket for realtime/job progress |
| Database | PostgreSQL + Prisma; Redis (cache, rate limit, queues) |
| Queue | BullMQ for AI / render / export jobs |
| Storage | S3-compatible (MinIO locally) + CDN; signed URLs; image variants/thumbnails |
| Search | Postgres full-text first; Meilisearch/OpenSearch later |
| Auth | NextAuth/Auth.js or Lucia + OAuth (Google/Apple), JWT/session cookies, 2FA (TOTP) |
| Payments | Stripe (Checkout, Billing, Webhooks, Customer Portal) |
| AI | Provider-agnostic `AIProvider` interface (text-to-image, inpaint, segmentation, upscale, LLM text). Local dev uses **mock provider**; production adapters pluggable (hosted APIs or self-hosted models such as SAM/rembg/Real-ESRGAN) |
| Realtime (V3) | Yjs / CRDT + WebSocket |
| DevOps | Docker + docker-compose for local; GitHub Actions CI; env-based config; IaC later |
| Monorepo | pnpm + Turborepo: `apps/web`, `apps/api`, `apps/worker`, `packages/editor-core`, `packages/ui`, `packages/shared-types`, `packages/ai-providers`, `packages/config` |

---

## 5. SYSTEM ARCHITECTURE (to be detailed in Phase 0)
Produce diagrams (Mermaid) in `docs/architecture/` for:
1. High-level system context (web, API, workers, DB, storage, AI providers, Stripe, email)
2. Editor document model (JSON schema for projects → pages → layers → objects → effects; versioned & migratable)
3. AI job lifecycle (request → credit check → queue → provider → moderation → store → notify)
4. Export/render pipeline (client export vs server render)
5. Billing & credits flow
6. Auth & permission model (RBAC matrix)
7. ER diagram of the database

---

## 6. DATA MODEL (starting point — refine in Phase 0)
`User, Account, Session, Workspace, Membership, Project(Design), ProjectVersion, Asset, AssetVariant, Folder, Template, TemplateCategory, Font, Sticker, BrandKit, AIJob, AIPrompt, CreditLedger, Plan, Subscription, Invoice, Post, Comment, Like, Follow, Notification, Report, ApiKey, FeatureFlag, AuditLog`

---

## 7. UX / DESIGN DIRECTION
- Original visual identity (not Picsart's purple/pink branding): define a design-token system (color, type, spacing, radius, motion) in `packages/ui`.
- **Home:** hero with "Start from scratch / Upload photo / Pick template / Try AI" CTAs, tool grid, trending templates, recent projects.
- **Editor layout:** top bar (file, undo/redo, zoom, export, share) · left rail (templates, uploads, elements, text, AI, brand, layers) · center canvas · right contextual properties panel · bottom page strip / timeline (video).
- Mobile: simplified bottom-sheet tools for browse/light edit; full editor recommended on desktop.
- Provide empty, loading, error, and paywall states for every screen.
- Deliver a **clickable low-fi wireframe set** (or Mermaid/ASCII wireframes) in Phase 0.

---

## 8. SUCCESS METRICS (instrument events for these)
Activation (first export within first session), editor retention D1/D7/D30, templates used per session, AI credits consumed/user, free→paid conversion, export success rate, p95 editor load time, job failure rate, support tickets per 1k users.

---

## 9. DELIVERY PLAN — PHASES (stop for approval after each)

**Phase 0 — Discovery & Planning (NO feature code)**
- `docs/PRD.md` (scope, personas, user stories with acceptance criteria, MoSCoW)
- `docs/FEATURE_MATRIX.md` (every feature from Section 2 → priority, complexity S/M/L/XL, dependencies, phase)
- `docs/ARCHITECTURE.md` + diagrams, `docs/DATA_MODEL.md`, `docs/API_SPEC.yaml` (OpenAPI draft)
- `docs/ROADMAP.md` (milestones, estimates, critical path, risks & mitigations)
- `docs/RISKS.md` (legal/IP, AI cost, performance, moderation, scope creep)
- `docs/TEST_STRATEGY.md`, `docs/SECURITY.md`, `docs/WIREFRAMES.md`
- `CLAUDE.md` with coding conventions, commands, folder map, definition of done
- Repo scaffold: monorepo, lint/format/typecheck/test/CI, docker-compose (Postgres, Redis, MinIO), seed script

**Phase 1 — Foundation:** auth, user/profile, workspace basics, DB migrations, file upload + storage + thumbnails, design-system UI kit, app shell, feature flags, admin skeleton, i18n + theme + PWA shell.

**Phase 2 — Core Editor MVP:** document model, canvas engine, layers, text/shapes/images/stickers, transforms, undo/redo, autosave, photo adjustments + filters, crop/resize, export (PNG/JPG/WebP/PDF) with free-tier watermark, My Designs dashboard.

**Phase 3 — Templates & Content:** template CRUD/admin publish, template browser/search/filters, use-template flow, stickers/fonts/stock libraries, favorites/recents, collage maker.

**Phase 4 — AI Layer (MVP):** AIProvider abstraction + mock + first real adapters, job queue, credit ledger + gating, **Background Remover, AI Image Generator, AI Writer**, moderation, prompt history, job progress UI.

**Phase 5 — Monetization:** plans config, Stripe subscriptions + webhooks + customer portal, credit bundles, paywalls, entitlement middleware, billing pages, pricing page, emails.

**Phase 6 — V2 Editing & AI Expansion:** advanced layers/masks/blend, retouch, brush tools, AI object remove/replace/expand/upscale, brand kit, magic resize, multi-page, QR generator.

**Phase 7 — Video Editor:** timeline, tracks, trim/split, text/captions, music, transitions, server render queue, export.

**Phase 8 — Community:** profiles, publishing, feed, follow/like/comment, remix ("Free to Edit"), notifications, moderation tools.

**Phase 9 — Teams & Collaboration:** workspaces/roles, sharing links, comments, shared brand kits; (stretch) real-time co-editing.

**Phase 10 — Business Suite & Platform:** ads creator, product-photo tools, scheduler, public API + Editor SDK, analytics dashboards.

**Phase 11 — Hardening & Launch:** performance pass, accessibility audit, security review, load tests, SEO, legal pages, docs, staging→production runbook.

---

## 10. DEFINITION OF DONE (per feature)
- Acceptance criteria met and demoable
- Types strict, lint clean, unit + (where relevant) E2E tests passing
- Accessible (keyboard + screen reader basics) and responsive
- Error/loading/empty states handled
- Analytics events added
- Docs/`PROGRESS.md` updated, migration + seed updated
- No secrets, no dead code, no TODO without a linked issue in `docs/BACKLOG.md`

---

## 11. FIRST ACTION — DO THIS NOW
1. Read this entire brief.
2. Ask me up to 5 blocking clarifying questions (budget/timeline, team size, preferred AI providers, hosting target, MVP scope cut).
3. Then execute **Phase 0** only: generate all documentation listed above, scaffold the monorepo, and present a summary with your recommended MVP cut line.
4. **Stop and wait for my approval** before starting Phase 1.
