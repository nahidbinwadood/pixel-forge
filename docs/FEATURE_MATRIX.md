# Feature Matrix

Every feature from brief §2. **Priority** keeps the brief's tag, except that "(deferred: lean cut)" marks brief-MVP items moved out of Phases 1–4 (see ASSUMPTIONS, lean cut). **Complexity:** S ≤ 2 days · M ≤ 1 week · L ≤ 2 weeks · XL > 2 weeks (solo dev).
Phase numbers follow brief §9. MVP = Phases 1–4.

## 2.1 Photo Editor
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Upload: drag & drop, picker, paste, URL; JPG/PNG/WebP/GIF/HEIC | MVP | M | Storage, worker (MIME check, thumbnails, HEIC convert) | 1 |
| Crop, rotate, flip, straighten, resize, ratio presets | MVP | M | Canvas engine, document model | 2 |
| Adjustments (brightness … grain, 13 sliders) | MVP | M | Effect model, Konva filters (D7) | 2 |
| Filters library, intensity, custom presets | MVP | M | Adjustments, plan gating (premium filters) | 2 |
| Curves / levels / HSL panel | V2 | L | WebGL filter pipeline | 6 |
| Retouch: blemish, teeth, skin smooth, eye/face | V2 | XL | Brush tools, face detection model | 6 |
| Brush, eraser, clone/stamp, blur & smudge | V2 | L | Raster layer support | 6 |
| Selection: rect, ellipse, lasso, magic wand, smart select | V2 | L | Masks; smart select needs segmentation (AI) | 6 |
| Layers basic: add/dup/delete/reorder/lock/hide/opacity | MVP | M | Document model | 2 |
| Layers full: groups, blend modes, masks, clipping | V2 | L | Layers basic, WebGL compositing | 6 |
| Undo/redo + history panel | MVP | M | Command-based document model | 2 |
| Compare before/after | MVP | S | Effect stack | 2 |
| Batch editing | V3 | L | Preset model, worker render | 10 |
| Non-destructive edit stack (JSON) | MVP | M | Document model schema + migrations | 2 |

## 2.2 AI Image Tools
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| AI Background Remover + refine brush | MVP | M | AIProvider, queue, credits, storage | 4 |
| AI Background Replace / Generate | V2 | M | BG remover, text-to-image | 6 |
| AI Object Remover / Magic Eraser | V2 | L | Inpaint adapter, mask brush | 6 |
| AI Replace (region + prompt) | V2 | L | Selection tools, inpaint | 6 |
| AI Expand / Outpainting | V2 | M | Outpaint adapter, canvas resize | 6 |
| AI Upscaler / Enhance / Denoise / Deblur | V2 | M | Upscale adapter | 6 |
| AI Image Generator (basic) | MVP | M | AIProvider, moderation, credits | 4 |
| Image-to-image / sketch-to-image | V3 | M | Image gen, brush | 10 |
| AI Avatar maker | V3 | L | Fine-tune/identity model provider | 10 |
| AI Style transfer / cartoonizer / anime | V3 | M | img2img adapter | 10 |
| AI Colorize / restore old photos | V3 | M | Restoration adapter | 10 |
| AI Sticker / Logo / Pattern / QR art / GIF generators | V3 | L | Image gen, QR generator, video export | 10 |
| AI Writer (captions, ad copy, slogans, hashtags) | V2 → pulled into MVP (Phase 4 per brief §9) | S | Anthropic adapter, moderation | 4 |
| AI Design Assistant (chat) | V3 | XL | Template engine, LLM tool use | 10 |
| Prompt history / favorites / remix | V2 (history pulled into MVP) | S | AIPrompt table | 4 (history), 6 (favorites/remix) |
| Prompt + output moderation | MVP | M | LLM classifier, provider safety checker | 4 |

## 2.3 Graphic Design Editor
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Canvas zoom, pan, grid, snap-to-object | MVP | M | Canvas engine | 2 |
| Rulers and draggable guides | MVP (Should) | S | Canvas engine | 2 |
| Canvas size presets (social, print, custom) | MVP | S | `shared` presets config | 2 |
| Objects: text, image, shape, sticker | MVP | L | Document model | 2 |
| Objects: line, icon, frame, QR, chart | V2 | M | Objects base; QR generator | 6 |
| Text basic: fonts, size, weight, color, spacing, align, shadow, outline | MVP | M | Font loading | 2 |
| Text advanced: gradient, curved, background, effect presets | V2 | M | Text basic | 6 |
| Shapes, gradient fills, strokes, radius, shadows, opacity | MVP | M | Objects base | 2 |
| Transform: move/resize/rotate/flip/align/distribute/group/lock/dup | MVP | M | Konva Transformer | 2 |
| Stickers/elements library + search | MVP | M | Sticker table, FTS | 3 |
| Background: solid, gradient, image | MVP | S | Document model | 2 |
| Background: pattern, video | MVP → (deferred: lean cut) | M | Pattern assets; video needs Phase 7 | 6 / 7 |
| Brand Kit | V2 | M | Workspace | 6 |
| Magic Resize | V2 | L | Multi-page, layout heuristics | 6 |
| Multi-page designs | V2 | M | Document model pages[] (schema ready in MVP) | 6 |
| Collage maker (grid) | MVP basic | M | Frames/image clipping | 3 |
| Collage free layout | MVP basic → (deferred: lean cut) | S | Collage grid | 6 |
| Mockups | V3 | L | Perspective warp | 10 |
| Animated text/elements | V3 | XL | Video timeline | 7+ |
| Keyboard shortcuts + context menu | MVP | S | Command registry | 2 |
| Autosave + cloud sync + crash recovery | MVP | M | ProjectVersion, IndexedDB snapshot | 2 |
| Version history UI | V2 | M | ProjectVersion | 6 |

## 2.4 Template Library
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Categories | MVP | S | TemplateCategory | 3 |
| Search, filters (size/category/style), trending, recent, favorites | MVP | M | FTS, Favorite table | 3 |
| Filter by color | MVP → (deferred: lean cut) | M | Palette extraction in worker | 6 |
| Preview → Use template → editor | MVP | S | Project clone service | 3 |
| Free vs premium badge + gating | MVP | S | plans config (D14) | 3 |
| Admin create/publish from editor | MVP internal | M | Admin RBAC | 3 |
| Creator-submitted templates + remix | V3 | L | Community, moderation | 8+ |

## 2.5 Video Editor
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Upload video/audio, trim/split/merge/speed/reverse/crop/rotate | V2 | L | WebCodecs, ffmpeg.wasm | 7 |
| Multi-track timeline with scrubbing | V2 | XL | Timeline document model | 7 |
| Transitions, effects, filters, keyframes | V2 | L | Timeline | 7 |
| Auto-captions / STT, subtitle styles, translation | V2 | L | STT provider, LLM translate | 7 |
| Music & SFX library, volume, fade, voiceover | V2 | M | Audio licensing, MediaRecorder | 7 |
| Video background remover | V3 | L | Video segmentation provider | 10 |
| AI video generation, talking avatar | V3 | XL | Video model provider | 10 |
| Video templates, slideshow, GIF maker | V2 | M | Timeline, templates | 7 |
| Export MP4/WebM/GIF by plan resolution | V2 | L | Server FFmpeg worker | 7 |
| Background render queue + notifications | V2 | M | BullMQ, notifications | 7 |

## 2.6 Libraries & Content
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Stock photos (Unsplash/Pexels), stickers, fonts | MVP | M | Provider API keys, attribution | 3 |
| Stock videos, icons, music, backgrounds, patterns | V2 | M | Licensing per source | 6 / 7 |
| Library search filters (orientation, type, free/premium) | MVP | S | FTS / provider query params | 3 |
| Library color filter | MVP → (deferred: lean cut) | M | Palette extraction | 6 |
| My Uploads, My Designs, Favorites, Recently Used | MVP | M | Asset, Project, Favorite tables | 1–3 |
| Folders | MVP | S | Folder table | 2 |
| Licensing metadata + attribution | MVP | S | Asset.license fields | 1 |

## 2.7 Community & Social
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Public profile + portfolio | V2 | M | Post | 8 |
| Publish to feed, tags, captions | V2 | M | Moderation pipeline (incl. CSAM hash matching) | 8 |
| Like, comment, save, share, report | V2 | M | Post, Report | 8 |
| Follow, personalized feed, explore, hashtags | V2 | L | Follow, ranking | 8 |
| Remix / Free to Edit | V2 | M | Project clone, Post | 8 |
| Challenges / contests | V3 | L | Voting, leaderboards | 10 |
| Notifications (in-app + email) | V2 | M | Notification table, email | 8 |
| Moderation tools: report queue, ban, takedown, DMCA | V2 | L | Admin, AuditLog | 8 |

## 2.8 Accounts, Workspaces & Collaboration
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Email+password, Google, email verification, password reset | MVP | M | Better Auth (D8), Resend | 1 |
| Magic link, TOTP 2FA | MVP → Should (plugin, low cost) | S | Better Auth plugins | 1 |
| Apple, Facebook login | MVP → (deferred: lean cut) | S | OAuth app review | 11 |
| Profile & settings (language, theme, notifications) | MVP | S | i18n, theme | 1 |
| Delete account, data export (GDPR) | MVP | M | Worker job, email | 1 |
| Teams/workspaces with roles, invites | V2 | L | Workspace, Membership | 9 |
| Share via link, real-time co-editing | V3 | XL | Yjs, WebSocket service (D11) | 9 |
| Comments on designs, approval flow | V3 | L | Share links | 9 |
| Shared brand kits & template libraries | V2 | M | Teams, Brand Kit | 9 |

## 2.9 Business / Ads / E-commerce
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Ad creator + product feed import | V3 | L | Templates, magic resize | 10 |
| Product photo tools (white BG, shadow, studio scene) | V2 | M | BG remover, image gen | 6 |
| Bulk product image processing | V3 | M | Batch jobs | 10 |
| Social scheduler / direct publish | V3 | XL | Platform API approvals | 10 |
| Link-in-bio / landing page maker | V3 | L | Hosting of public pages | 10 |
| Logo maker + identity pack | V3 | L | AI logo gen, brand kit | 10 |
| QR code generator | V2 | S | QR library | 6 |

## 2.10 Monetization & Billing
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Plans (Free/Plus/Pro/Team/Enterprise) in config | MVP | S | `shared/plans.ts` (D14) | 1 |
| Credit ledger, monthly refill, usage history | MVP | M | CreditLedger, scheduled worker job | 4 |
| Paid credit bundles | MVP → (deferred: lean cut) | M | Stripe | 5 |
| Stripe subscriptions, coupons, trials, proration, invoices, tax, cancel/resume, webhooks | MVP → (deferred: lean cut) | XL | Stripe, entitlement middleware | 5 |
| Feature gating (premium filters/templates/export quality/watermark) | MVP | M | plans config, `can(user, feature)` | 2–4 |
| Watermark on free exports | MVP | S | Export pipeline (D13) | 2 |
| Commercial-use license flags on assets | MVP | S | Asset/Template license fields | 1 |
| Public REST API + Editor SDK, API keys, quotas | V3 | XL | ApiKey, extracted API (D1) | 10 |

## 2.11 Platform & Cross-cutting
| Feature | Priority | Cx | Dependencies | Phase |
|---|---|---|---|---|
| Responsive web, PWA installable | MVP | M | Next.js manifest + SW | 1 |
| Mobile apps (Expo) | V3 (out of scope) | XL | Editor SDK | — |
| i18n framework (EN, RTL-ready) | MVP | S | next-intl | 1 |
| Accessibility WCAG 2.1 AA | MVP | M (ongoing) | shadcn/Radix primitives | 1–4, audit in hardening |
| Dark/light theme | MVP | S | CSS tokens | 1 |
| Onboarding tour, help center, feedback widget | V2 | M | — | 6 |
| Global search (templates, assets, designs) | MVP | M | Postgres FTS | 3 |
| Global search: creators | V2 | S | Community | 8 |
| SEO tool landing pages, legal pages | MVP basic | M | Marketing layout | Beta hardening (wk 11–12) |
| Pricing page | MVP → (deferred: lean cut) | S | Stripe plans | 5 |
| Blog, programmatic template SEO | MVP basic → (deferred: lean cut) | M | CMS / MDX | 11 |
| Analytics events + feature flags | MVP | S | `track()`, FeatureFlag (D15) | 1 |
| A/B testing | MVP flags → (deferred: lean cut) | M | PostHog experiments | 11 |
| Admin: users, credits, templates/assets, flags, health | MVP basic | L | RBAC, AuditLog | 1 (skeleton) → 3–4 |
| Admin: subscriptions | MVP → (deferred: lean cut) | S | Stripe | 5 |
| Transactional email (welcome, verify, reset, export ready, data export) | MVP | S | Resend + React Email | 1 |
| Lifecycle email (receipt, credit low) | MVP → partial | S | Credits; receipts need Stripe | 4 / 5 |
| Legal: Terms, Privacy, Cookie consent, DMCA, content + AI policy | MVP | S | Counsel review | Beta hardening |
