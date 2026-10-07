# CLAUDE CODE PROMPT — PixelForge UI/UX Redesign ("Neo-Creative" Design Overhaul)

> Paste this into Claude Code from the repo root. It assumes the app already exists (Next.js + React + TypeScript + Tailwind). Save it as `docs/DESIGN_REDESIGN_BRIEF.md` too.

---

## 0. ROLE

You are a **Senior Product Designer + Design-Systems Engineer** with 10+ years shipping consumer creative tools. You are redesigning the existing PixelForge web app. The current design is weak, dated, and unattractive. Your job: make it feel **modern, premium, playful, and futuristic**, in the same quality tier as Canva and Picsart, but with an **original visual identity**.

**Hard rules**
1. **Do not copy** Picsart's or Canva's logos, exact colors, illustrations, layouts pixel-for-pixel, or copy. Take *inspiration from the quality bar and patterns* (big friendly hero, tool grids, template galleries, bento layouts, left-rail editor), then make it unmistakably our own.
2. **Do not break functionality.** This is a visual/UX redesign. Keep routes, props, API calls, and state logic working. Refactor styling and markup, not business logic, unless a change is required for UX and you flag it.
3. **Audit first, then design, then implement.** No random restyling.
4. Work in phases and **stop for my approval** after Phase A (audit + direction) and after Phase C (core screens). Use screenshots (Playwright) as evidence at each stop.
5. Everything must be driven by **design tokens**, not hardcoded values.

---

## 1. DESIGN DIRECTION — "Aurora Studio"

**Mood:** futuristic creative lab meets friendly playground. Confident, glowing, fluid, never cold or corporate.

**Keywords:** dark-first, aurora gradients, glassmorphism (used sparingly), soft neon glow, bento grids, rounded geometry, kinetic micro-interactions, depth through layered light, generous whitespace.

**Anti-goals (avoid):** flat default Tailwind look, gray-on-white boxes, cramped sidebars, random gradients, heavy skeuomorphism, cluttered toolbars, generic stock-SaaS hero, emoji as icons, Lorem ipsum.

### 1.1 Color system (tokens in CSS variables + Tailwind theme)
Define for **dark (default)** and **light** themes, with a theme toggle (system / light / dark).

- **Canvas / surfaces (dark):** `bg-0 #07070D` (page) · `bg-1 #0D0D18` (panels) · `bg-2 #14142A` (cards) · `bg-3 #1C1C38` (hover/raised) · hairline borders `rgba(255,255,255,0.08)`
- **Brand gradient ("Aurora"):** violet `#7C5CFF` → electric blue `#2DA8FF` → cyan-mint `#2EF2C9`, with an accent warm pop `#FF5CA8` → `#FFB35C` for highlights/premium.
- **Semantic:** success `#2EE59D`, warning `#FFC24D`, danger `#FF5C7A`, info `#4DB8FF`.
- **Text:** primary `#F5F6FF`, secondary `#A7A9C7`, muted `#6B6E8F`.
- **Light theme:** off-white `#F7F7FC` surfaces, white cards, same gradient accents, softer shadows.
- Provide 3 reusable gradient tokens (`--grad-aurora`, `--grad-premium`, `--grad-mesh`) and a **glow** token (`0 0 40px -10px rgba(124,92,255,.55)`).
- Contrast must meet **WCAG AA** in both themes.

### 1.2 Typography
- Display/headings: a characterful geometric sans (e.g. **Clash Display**, **Satoshi**, **Cabinet Grotesk**, or **Sora**) — pick one, self-host via `next/font`.
- UI/body: **Inter** or **Geist** for readability.
- Mono (prompts, shortcuts): **JetBrains Mono** / **Geist Mono**.
- Fluid type scale using `clamp()` (hero up to ~72–88px desktop). Tight tracking on large headings, generous line-height on body.
- Gradient text only for hero keywords and key numbers, never body copy.

### 1.3 Shape, depth, spacing
- Radius scale: `8 / 12 / 16 / 24 / 32 / full`. Cards default to 20–24px.
- 4px spacing base, 8-pt rhythm. Max content width 1280px, editor is full-bleed.
- Elevation: layered soft shadows + 1px inner highlight border; glass panels = `backdrop-blur-xl` + translucent surface + hairline border. Use glass only for floating UI (nav, popovers, command palette, editor floating toolbars).
- Background atmosphere: subtle **animated mesh/aurora gradient blobs** + faint noise/grain overlay + optional grid/dot pattern. Must be GPU-cheap and respect `prefers-reduced-motion`.

### 1.4 Iconography & imagery
- One icon family (Lucide or Phosphor), consistent 1.5px stroke, custom gradient-filled icons for the main tool tiles.
- Hero/marketing visuals: layered **product UI mockups** floating with parallax, plus abstract gradient 3D-ish shapes (CSS/SVG/Three.js-lite, no copyrighted art). Provide generated placeholder imagery via SVG/CSS so nothing breaks.

### 1.5 Motion language
- Library: **Framer Motion** (or Motion One). Easing: spring (stiffness ~300, damping ~30) for UI, `cubic-bezier(.22,1,.36,1)` for entrances.
- Durations: micro 120–180ms, panels 240–320ms, page/hero 500–800ms.
- Patterns: staggered card reveals on scroll, magnetic/hover-lift buttons with glow, animated gradient borders on primary CTAs, skeleton shimmer loaders, smooth layout transitions (shared element) from template card → editor, number count-ups, subtle cursor-follow spotlight on hero/cards.
- **Always** honor `prefers-reduced-motion`. No motion that blocks interaction.

---

## 2. DESIGN SYSTEM DELIVERABLES (`packages/ui` or `src/components/ui`)

Build/refactor on **shadcn/ui + Radix + Tailwind**, fully tokenized:

- Foundations: colors, type, spacing, radius, shadows, blur, gradients, z-index, motion tokens → `tokens.css` + `tailwind.config` + `docs/design/TOKENS.md`
- Components (all with hover, focus-visible, active, disabled, loading, error states; dark + light):
  Button (primary-gradient, secondary, ghost, glass, danger, icon, split), Input, Textarea, Select, Combobox, Slider (with gradient track, used heavily in editor), Switch, Checkbox, Radio, Tabs, Segmented control, Tooltip, Popover, Dropdown, Context menu, Modal/Dialog, Drawer/Sheet, Command palette (⌘K), Toast, Badge/Chip, Avatar, Progress/Credit meter, Skeleton, Empty state, Card variants (tool tile, template card, asset card, pricing card, stat card), Color picker (swatches + gradient editor + eyedropper UI), Upload dropzone, Pagination/infinite grid, Breadcrumbs, Kbd shortcut hint.
- **Storybook** (or a `/design-system` route) showing every component, state, and theme. Add visual snapshot tests for key components.
- `docs/design/COMPONENT_GUIDELINES.md`: usage dos/don'ts.

---

## 3. SCREENS TO REDESIGN (in priority order)

### 3.1 Global shell
- **Top nav (glass, sticky, shrinks on scroll):** logo, mega-menu (Tools · Templates · Video · AI · Pricing · Community), search, theme toggle, credits meter, "Create" gradient CTA, avatar menu.
- **Footer:** rich, multi-column, newsletter, social, language switcher.
- **Command palette (⌘K):** jump to tools, templates, projects, settings.
- Toast, modal, and loading patterns unified.

### 3.2 Landing / Home (marketing)
1. **Hero:** oversized headline with gradient keyword, subcopy, 2 CTAs ("Start creating — free", "Watch demo"), upload-or-prompt input bar ("Describe what you want to create…" with AI sparkle), floating UI mockup collage with parallax + animated cursors.
2. **Logo/trust strip** (placeholder brands) + live counters.
3. **Tool bento grid:** asymmetric tiles (Photo Editor, Background Remover, AI Generator, Video, Collage, Templates, Brand Kit) with looping mini-previews on hover (video/CSS animation).
4. **"How it works"** 3-step scroll-driven section.
5. **Before/after slider** showcase for AI tools.
6. **Template carousel** with category chips and hover preview.
7. **Feature deep-dives** (alternating layout, sticky scroll).
8. **Community showcase** masonry gallery.
9. **Pricing teaser**, testimonials, FAQ accordion, final big CTA with aurora background.

### 3.3 Dashboard ("Home" after login)
- Greeting + quick-create row (blank canvas, upload, AI generate, template, video).
- "Continue editing" recent projects (hover-preview, quick actions), folders, filters, grid/list toggle, bulk select.
- Credits/plan widget, tips/what's new card, trending templates rail.

### 3.4 Templates page
- Sticky search + filter chips (size, category, style, color, free/premium), masonry grid with lazy-loaded images, hover preview with "Use template", premium badge, infinite scroll, skeletons, empty/error states. Template detail modal with similar suggestions.

### 3.5 AI Tools hub + individual tool pages
- Tool directory with search + category tabs.
- Individual tool layout: left control panel (prompt, style chips, sliders), center result canvas with before/after, right history. Animated "generating" state (shimmering aurora skeleton + progress), result actions (variations, upscale, send to editor, download). Credit cost shown before running.

### 3.6 **The Editor (most important screen)**
- **Full-bleed dark workspace.** Layout: slim top bar (project name, undo/redo, zoom, share, export gradient button) · **icon-first left rail** with expandable flyout panels (Templates, Uploads, Elements, Text, AI, Brand, Layers) · **canvas** with soft vignette, subtle checkerboard/dot grid, floating zoom/page controls bottom-center · **context-aware right Properties panel** (changes by selection type) · floating **selection toolbar** above the selected object (glass) · optional bottom page strip / timeline.
- Rich micro-interactions: smooth snapping guides with glow, rotation/resize handles with refined styling, drag-and-drop ghost previews, layer reorder animations.
- Panels collapsible; **focus mode** hides all chrome. Keyboard-shortcut overlay (`?`).
- Export modal: format/quality/size controls with live file-size estimate and premium upsell done tastefully.
- Performance first: UI chrome must never lag the canvas.

### 3.7 Auth screens
- Split layout: left form (social buttons, magic link), right animated aurora showcase. Clear validation, loading, and error states.

### 3.8 Pricing & Billing
- Monthly/yearly toggle with savings pill, highlighted "Most popular" card with animated gradient border, comparison table, credit bundles, FAQ, trust badges.

### 3.9 Community / Profile (if built)
- Masonry feed, creator cards, follow buttons, profile header with banner + stats, remix button.

### 3.10 Settings, Brand Kit, Admin
- Clean, calm, card-based, consistent with the system (lower visual intensity than marketing).

---

## 4. UX PRINCIPLES & QUALITY BAR
- **3-click rule** from landing to first edit. Reduce steps everywhere; smart defaults.
- Clear hierarchy: one primary action per view.
- Every list/grid has **loading (skeleton), empty (illustrated + CTA), and error (retry)** states.
- Progressive disclosure in the editor: beginner-friendly defaults, advanced controls behind "Advanced".
- Microcopy: friendly, short, action-oriented. Rewrite weak copy across the app.
- **Responsive:** design mobile (≥360), tablet, desktop, wide. Editor is desktop-optimized with a simplified touch layout (bottom sheets) on small screens.
- **Accessibility:** WCAG 2.1 AA, full keyboard nav, visible focus rings (gradient ring), ARIA on custom widgets, reduced-motion, color-not-sole-indicator, screen-reader labels on icon buttons.
- **Performance budgets:** LCP < 2.5s on marketing pages, CLS < 0.1, no layout shift from fonts/images, lazy-load below-fold media, optimize with `next/image`, code-split the editor, avoid heavy blur on large areas (fallback to solid on low-power devices).
- **i18n/RTL-safe** layouts (logical CSS properties, no hardcoded left/right where avoidable).

---

## 5. EXECUTION PLAN

**Phase A — Audit & Direction (no big code changes yet)**
1. Run the app, screenshot every route/state at 375 / 768 / 1280 / 1920 (Playwright script saved in `scripts/screenshots`).
2. Write `docs/design/AUDIT.md`: what's wrong (hierarchy, spacing, contrast, consistency, responsiveness, a11y), ranked by impact, with screenshots.
3. Propose the final direction: moodboard description, palette, type pairing, 3 hero concepts (described + low-fi layout). Recommend one.
4. **STOP. Wait for my approval.**

**Phase B — Design System**
Implement tokens, theme switching, base components, Storybook/`/design-system`. Replace hardcoded styles progressively.

**Phase C — Core Screens**
Global shell → Landing → Dashboard → Templates → Auth. Provide before/after screenshots. **STOP for approval.**

**Phase D — Editor & AI Tools**
Redesign editor chrome and AI tool pages, with motion and keyboard shortcuts.

**Phase E — Pricing, Settings, Community, Admin, Empty/Error states**

**Phase F — Polish & QA**
Motion pass, a11y audit (axe + manual keyboard), Lighthouse, cross-browser (Chrome/Safari/Firefox), visual regression snapshots, reduced-motion and low-power fallbacks, cleanup of dead styles.

---

## 6. DEFINITION OF DONE
- No hardcoded colors/spacing outside tokens; both themes pass AA contrast.
- Every screen has loading/empty/error states and works at all four breakpoints.
- Lighthouse ≥ 90 (Perf/A11y/SEO) on marketing pages; editor interaction stays smooth (no dropped frames from UI chrome).
- No regressions: existing tests pass; E2E smoke test covers signup → create → edit → export.
- `docs/design/` contains AUDIT, TOKENS, COMPONENT_GUIDELINES, and CHANGELOG with before/after screenshots.
- Visual QA checklist signed off per screen.

---

## 7. FIRST ACTION — DO THIS NOW
1. Read the codebase structure (routes, layouts, existing UI components, Tailwind config).
2. Execute **Phase A** only: screenshots, `AUDIT.md`, and your recommended design direction with 3 hero concepts.
3. Ask me up to 3 questions only if truly blocking (e.g. preferred brand color, light-vs-dark default, reference screenshots).
4. **Stop and wait for my approval** before Phase B.
