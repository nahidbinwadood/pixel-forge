# Wireframes (low-fi)

These are ASCII wireframes for the MVP screens. They fix layout and hierarchy only. Visual design follows the tokens in §10. The product name is `APP_NAME` (PixelForge).

## 1. Home / Dashboard (signed in, desktop)
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ◆ PixelForge   [ 🔍 Search templates, designs, uploads…        ]   ⚡120  ☾  (A)│
├───────────┬────────────────────────────────────────────────────────────────────┤
│ ⌂ Home    │  What will you make today?                                         │
│ ▣ Designs │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│ ▤ Templates│ │  ＋ Blank   │ │ ⤒ Upload   │ │ ▦ Template │ │ ✦ Try AI   │       │
│ ⤒ Uploads │  │  canvas    │ │  photo     │ │            │ │            │       │
│ ✦ AI tools│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│ ♡ Favorites│                                                                   │
│           │  Sizes:  [IG post] [IG story] [YT thumb] [Poster] [Custom…]  →     │
│           │                                                                    │
│ ───────── │  AI tools                                                          │
│ ⚡ 120 cr  │  [Remove background] [Generate image] [AI writer]                 │
│ Free plan │                                                                    │
│ [Upgrade] │  Recent designs                                      See all →     │
│           │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │
│           │  │thumb │ │thumb │ │thumb │ │thumb │ │thumb │                     │
│           │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                     │
│           │  Name · 2h ago                                                     │
│           │                                                                    │
│           │  Trending templates                                  See all →     │
│           │  ┌────┐ ┌────┐ ┌──────┐ ┌────┐ ┌────┐  (★ = premium badge)        │
│           │  └────┘ └────┘ └──────┘ └────┘ └────┘                              │
└───────────┴────────────────────────────────────────────────────────────────────┘
```
`⚡120` is the credit balance chip, which links to the credit ledger. `☾` is the theme toggle. `(A)` is the avatar menu: Settings, Help, Sign out.

## 2. Editor (desktop)
```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ◆ ← Designs │ Untitled design ✎ │ ↶ ↷ │ Saved ✓ │  − 75% ＋ ⤢ │ ⚡120 │ [Share] [Export ▾]│
├────┬──────────────────┬───────────────────────────────────────────┬────────────────┤
│ ▦  │ TEMPLATES        │                                           │ PROPERTIES     │
│Tmpl│ [🔍 search     ] │   ┆ rulers / guides                       │ (contextual)   │
│ ⤒  │ [All▾][Size▾]    │   ┆                                       │ ── Text ─────  │
│Upld│ ┌────┐ ┌────┐    │   ┌───────────────────────────────┐       │ Font [Inter ▾] │
│ ◇  │ └────┘ └────┘    │   │                               │       │ Size [48]  B I │
│Elem│ ┌────┐ ┌────┐    │   │      ┌──────────────┐         │       │ Color ■  Align │
│ T  │ └────┘ └────┘    │   │      │ SUMMER SALE  │◄─ sel.  │       │ Spacing ──●──  │
│Text│                  │   │      └──────────────┘ ↻       │       │ Line h. ──●──  │
│ ✦  │                  │   │         [img]                 │       │ ── Effects ──  │
│ AI │                  │   │                               │       │ Shadow  [ ]    │
│ ☰  │                  │   └───────────────────────────────┘       │ Outline [ ]    │
│Lyrs│                  │                                           │ ── Arrange ──  │
│    │                  │   floating toolbar on selection:          │ ⇤ ⇥ ⤒ ⤓ ⧉ 🔒 🗑 │
│    │                  │   [⧉ dup] [🔒] [🗑] [⋯]                     │ Opacity ──●──  │
├────┴──────────────────┴───────────────────────────────────────────┴────────────────┤
│ Pages: [■ 1] [＋]                    (V2: multi-page)          Grid ▢  Snap ✓  ⓘ ?  │
└────────────────────────────────────────────────────────────────────────────────────┘
```
- **Left rail tabs:** Templates · Uploads · Elements (shapes, stickers, stock photos, backgrounds) · Text (presets + font search) · AI (BG remove, generate, writer) · Layers (reorder by drag, hide 👁, lock 🔒, rename, opacity).
- **Right panel** follows the selection: nothing selected → Canvas (size, background); text → Text; image → Image (Adjust · Filters · Crop · BG remove · Before/After hold-to-compare); shape → Fill/Stroke/Radius; multiple selected → Align/Distribute/Group.
- **Photo mode** (entered from "Upload photo") opens the same editor with the photo as a locked background layer and the right panel on Adjust.
- The left drawer collapses to the icon rail below 1280 px. Below 1024 px a "best on desktop" banner appears, and light editing still works.

### Editor sub-panel: Image → Adjust / Filters
```
┌ IMAGE ───────────────────┐
│ [Adjust] [Filters] [Crop]│
│ Brightness  ─────●────   │
│ Contrast    ───●──────   │
│ Saturation  ─────●────   │
│ Exposure · Highlights ·  │
│ Shadows · Temp · Tint ·  │
│ Vibrance · Sharpen · Blur│
│ Vignette · Grain   (more)│
│ [Reset]   [◐ Hold: before]│
├──────────────────────────┤
│ Filters  ┌──┐┌──┐┌──┐┌─★┐│
│          └──┘└──┘└──┘└──┘│
│ Intensity ──────●───     │
└──────────────────────────┘
```

## 3. Template browser (full page)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◆ PixelForge  [ 🔍 "birthday"                          ]            ⚡ (A)    │
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Category         │ 1,240 templates · Sort [Trending ▾]                       │
│ ○ All            │ ┌──────┐ ┌────┐ ┌──────┐ ┌────┐ ┌──────┐                 │
│ ● Social media   │ │      │ │    │ │  ★   │ │    │ │      │  masonry grid   │
│ ○ Business       │ │      │ └────┘ │      │ │    │ └──────┘  hover: ♡ + Use │
│ ○ Events         │ └──────┘ ┌────┐ └──────┘ └────┘ ┌──────┐                 │
│ Size             │ ┌────┐   │    │ ┌──────┐ ┌────┐ │      │                 │
│ [IG post][Story] │ └────┘   └────┘ └──────┘ └────┘ └──────┘                 │
│ Style  [Minimal] │                                                           │
│ Color  ● ● ● ● ● │                [ Load more ]  (infinite scroll)           │
│ ☐ Free only      │                                                           │
└──────────────────┴───────────────────────────────────────────────────────────┘

Preview modal:
┌──────────────────────────────────────────────┐
│  ┌──────────────────┐  Birthday Bash Story ★ │
│  │                  │  1080 × 1920 · Story   │
│  │    preview       │  Tags: party, neon     │
│  │                  │  [ Use this template ] │
│  └──────────────────┘  [♡ Save]   [✕]        │
│  More like this: ┌──┐┌──┐┌──┐┌──┐            │
└──────────────────────────────────────────────┘
```

## 4. AI image generator panel (editor left drawer, AI tab)
```
┌ AI ────────────────────────────┐
│ [Generate] [Remove BG] [Write] │
│ Describe your image            │
│ ┌────────────────────────────┐ │
│ │ a cozy coffee shop at dawn,│ │
│ │ watercolor                 │ │
│ └────────────────────────────┘ │
│ Style  [None][Photo][Watercolor│
│         ][3D][Anime][Flat] →   │
│ Aspect [1:1][4:5][9:16][16:9]  │
│ ▸ Advanced                     │
│   Negative prompt [          ] │
│   Seed [random ⟳]  Images [2▾] │
│ [ ✦ Generate · 4 ⚡ ]           │
│ Balance after: 116 ⚡          │
├────────────────────────────────┤
│ Results                        │
│ ┌─────┐ ┌─────┐   ⟳ Remix      │
│ │░░░░░│ │░░░░░│   (skeleton    │
│ └─────┘ └─────┘    while busy) │
│ click → add to canvas          │
├────────────────────────────────┤
│ History ▾  ♡ favorites         │
│ • "neon cat…"  ↺ reuse         │
└────────────────────────────────┘
```

## 5. Background remover flow
```
Step 1: select image          Step 2: running              Step 3: result
┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
│ [photo selected]  │        │ ░░ photo, shimmer │        │ ▒▒ subject on      │
│                   │  ───►  │ ░░ overlay        │  ───►  │ ▒▒ checkerboard    │
│ Right panel:      │        │ "Removing         │        │ [◐ before/after]   │
│ [✂ Remove BG · 1⚡]│        │  background… 60%" │        │ [Refine brush ▸]   │
└───────────────────┘        │ [Cancel]          │        │   (V2: keep/erase) │
                             └───────────────────┘        │ [Undo] [Replace BG │
                                                          │  ▸ color/image]    │
                                                          └───────────────────┘
```
The result replaces the image source in a single undoable command, and the original stays in history. Standalone entry at `/tools/background-remover`: upload → auto-run → download PNG or "Open in editor".

## 6. Export dialog
```
┌ Export ───────────────────────────────────────┐
│ Format   (●) PNG  ( ) JPG  ( ) WebP  ( ) PDF  │
│ Size     [1×  1080 × 1080 ▾]   2× ★  4× ★     │
│ Quality  ───────●──  (JPG/WebP only)          │
│ ☐ Transparent background (PNG/WebP)           │
│ Pages    [All ▾]                    (V2)      │
│ ┌───────────────────────────────────────────┐ │
│ │ ⓘ Free plan exports include a small       │ │
│ │   PixelForge watermark.                   │ │
│ │   [Remove watermark → Upgrade]            │ │
│ └───────────────────────────────────────────┘ │
│                      [Cancel]  [ ⤓ Download ] │
└───────────────────────────────────────────────┘
```
Premium options (★) stay visible but lock on click, which opens the paywall (§8).

## 7. Mobile browse view (bottom sheet)
```
┌──────────────────────┐   ┌──────────────────────┐
│ ◆ PixelForge   🔍 (A)│   │ ┌──────────────────┐ │
│ [＋ Create]           │   │ │  preview image   │ │
│ Quick tools          │   │ │                  │ │
│ [✂ BG] [✦ Gen] [✎ AI]│   │ └──────────────────┘ │
│ Trending             │   │ ▔▔▔▔▔ (drag handle)  │
│ ┌────┐┌────┐┌────┐   │   │ Birthday Bash ★      │
│ └────┘└────┘└────┘   │   │ 1080×1920 · Story    │
│ My designs           │   │ [Use template]       │
│ ┌────┐┌────┐         │   │ [♡ Save] [Share]     │
│ └────┘└────┘         │   │ More like this →     │
├──────────────────────┤   └──────────────────────┘
│ ⌂   ▤   ＋   ✦   (A) │    bottom sheet (half → full)
└──────────────────────┘
 bottom nav: Home · Templates · Create · AI · Me
```
Light edit on mobile means text replace, photo swap, filters, BG remove and export. Each tool opens as a bottom sheet over the canvas.

## 8. Paywall and insufficient-credits modals
```
┌ Out of credits ─────────────────────────┐   ┌ Unlock with Pro ★ ───────────────────────┐
│        ⚡ 0 left                         │   │ This template is part of Pro.            │
│ Generating needs 4 credits.             │   │ ✓ All premium templates & filters        │
│ Free credits refill on Nov 1.           │   │ ✓ No watermark · 4× export               │
│                                         │   │ ✓ 500 AI credits / month                 │
│ [ See plans ]  [ Maybe later ]          │   │ [ See plans ]   [ Not now ]              │
│ (Credit packs: coming soon — Phase 5)   │   │ Billing launches soon: join the waitlist │
└─────────────────────────────────────────┘   └──────────────────────────────────────────┘
```
Until Stripe arrives (Phase 5), "See plans" opens the pricing page with a waitlist/notify CTA (ASSUMPTIONS D14). Every paywall open fires `paywall_viewed {feature, source}`.

## 9. States per screen

| Screen | Empty | Loading | Error | Paywall |
|---|---|---|---|---|
| Dashboard | No designs: friendly illustration + "Create your first design" + 3 starter size cards | Skeleton cards for recents and templates | Section-level inline error + Retry; the rest of the page still renders | Upgrade card in the sidebar (non-blocking) |
| Editor | New blank canvas shows a ghost hint: "Add text, drop a photo, or pick a template" | Full-screen canvas skeleton with progress until fonts and assets resolve; target < 3 s | Load failure: message + Retry + "Open last saved version". Save failure: top-bar "Not saved — retrying" (autosave keeps a local copy in IndexedDB and never discards edits) | Locked premium items show ★; clicking opens the paywall. Free export shows the watermark notice |
| Template browser | No results: "No templates match", plus clear filters and suggested categories | Masonry skeleton tiles; infinite scroll spinner at the bottom | Grid error + Retry | ★ badge; "Use" on premium opens the paywall (402 `PLAN_REQUIRED`) |
| Uploads panel | "Drop photos here or browse", listing accepted formats | Per-file progress bar; tile shows "Processing…" until `ready` | Per-file error with reason ("Unsupported file type", "Too large for Free plan: max 25 MB") + Remove | Storage quota reached opens the upgrade prompt |
| AI generator | First use: example prompts as clickable chips | Skeleton result tiles + elapsed time + Cancel; polling every 1–2 s | Failed: "Something went wrong — credits refunded" + Retry. Blocked: policy message, link to the AI policy, credits refunded | 0 credits: button becomes "Get credits" and opens the out-of-credits modal |
| BG remover | Prompt to select or upload an image | Shimmer overlay on the image + percentage + Cancel | Failure toast + "credits refunded" + Retry | Same as AI generator |
| AI writer | Example briefs | Streaming-style placeholder lines | Error + Retry, refund note | Same as AI generator |
| Export dialog | — | Button spinner "Preparing…" (large PDFs show progress) | "Export failed" + Retry; suggests a smaller size on memory error | ★ sizes and the watermark notice link to the paywall |
| Mobile browse | Same as dashboard, single column | Skeletons | Inline retry | Bottom-sheet paywall |
| Admin | "No reports in queue 🎉" | Table skeleton | Table-level error + Retry | n/a |

All loading states respect `prefers-reduced-motion` (static placeholders, no shimmer). Errors are announced via an `aria-live="polite"` region, and blocking modals trap focus and return it to the trigger when closed.

## 10. Design tokens (summary — values live in `apps/web` CSS variables)

**Color.** The accent is "ember" orange on a neutral "ink" scale, deliberately warm and far from Picsart's purple/pink.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink-950…50` | neutral greys, slightly warm (e.g. `#14110F` → `#FAF8F6`) | inverted | Text, surfaces, borders |
| `--ember-500` (accent) | `#F2622E` | `#FF7A45` | Primary buttons, focus, selection handles |
| `--ember-600` | `#D94E1C` | `#F2622E` | Hover/pressed |
| `--surface` / `--surface-raised` | `#FFFFFF` / `#FAF8F6` | `#14110F` / `#1E1A17` | Canvas chrome, panels |
| `--success` / `--warning` / `--danger` | `#1F9D55` / `#D99A06` / `#D93636` | lighter variants | Status |
| `--premium` | `#C98A0B` (gold) | `#E0A82E` | ★ badges |

Accent text uses `--ember-600` on light surfaces so it meets 4.5:1 contrast. White text on `--ember-500` is checked against a 4.5:1 target, and the darker `--ember-600` is used for button backgrounds if it falls short. The canvas workspace background is a neutral grey that doesn't tint the user's colours.

**Type.** UI uses **Inter** (variable). Display uses **Bricolage Grotesque** for marketing headings and empty states. Monospace (shortcuts, numbers) uses JetBrains Mono. Scale: 12 · 13 · 14 (UI base) · 16 · 20 · 24 · 32 · 48 · 64.

**Spacing.** 4 px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Panels use 16 px padding and 8 px gaps. Touch targets are ≥ 44 px on mobile and ≥ 32 px on desktop.

**Radii.** `sm 4` (inputs, chips) · `md 8` (buttons, cards) · `lg 12` (panels, modals) · `xl 20` (marketing cards) · `full` (avatars, pills).

**Elevation.** Three shadow levels: panel, popover, modal. Dark mode leans on surface lightness more than shadow.

**Motion.** Durations are 120 ms (hover, press), 200 ms (panels, popovers) and 320 ms (modals, sheets). Easing is `cubic-bezier(0.2, 0, 0, 1)`. Under `prefers-reduced-motion: reduce`, transitions drop to opacity-only at ≤ 80 ms, skeleton shimmer and canvas zoom animations are disabled, and drag/transform stays immediate.

**Focus.** 2 px `--ember-500` outline + 2 px offset on `:focus-visible`, never removed.
