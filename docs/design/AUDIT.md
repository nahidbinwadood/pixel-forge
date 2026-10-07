# Design Audit & Direction (Phase A)

**Date:** 2026-10-07. **Scope:** every route that exists today (landing, sign-in, sign-up, forgot-password, home, uploads empty + filled, settings, admin users / flags / health). Each was captured at 375 / 768 / 1280 / 1920 px in light and dark: 88 screenshots in [`screenshots/before/`](screenshots/before/), produced by `npx playwright test -c scripts/screenshots`.

Context: only Phase 1 (foundation) exists. The editor, templates, AI tools, pricing, video and community are **not built yet**, so they can't be audited. Their design is planned in the Direction section and gets implemented when each feature lands.

---

## 1. What's worth keeping

- **Token architecture.** Every color already goes through CSS variables (shadcn names) and Tailwind `@theme`, with no hard-coded hex in components. The redesign swaps values and adds tokens; it doesn't need to re-plumb anything.
- **Accessibility groundwork.** Skip link, real `<label>`s, `aria-current` in the nav, live regions for credits and uploads, reduced-motion CSS, and focus rings on shadcn components.
- **State coverage exists:** skeletons on uploads, empty states on home and uploads, an error-with-retry on uploads, toast feedback, a confirmation dialog on delete.
- **Information architecture.** It's small and sensible, and it doesn't need restructuring, only re-presenting.

## 2. Problems, ranked by impact

| # | Issue | Where | Impact |
|---|---|---|---|
| 1 | **The landing page sells a visual tool with zero visuals.** It's a text headline, two buttons and four identical icon cards, and the bottom 40% of the 1280 viewport is empty. Nothing shows what the product does to a photo. | `landing--1280-*`, `landing--375-*` | Highest. It's the first impression, and it reads as "generic SaaS template", the exact anti-goal in the brief. |
| 2 | **Home looks broken.** 3 of 4 quick-create tiles are greyed out as "Coming soon", and the only other content is an empty dashed box. A new user's first screen is mostly disabled. | `home--*` | High. Activation suffers, and it signals an unfinished product. |
| 3 | **No typographic personality.** Inter is used at every level. Headline vs body contrast comes only from weight. Card titles (`CardTitle`) are regular weight while page H1s are bold, which is inconsistent. | all | High. This is the main reason it feels "default Tailwind". |
| 4 | **Dark mode is muddy.** The ember accent at low alpha becomes brown, as in the active nav pill and the icon chips on home and landing. Surfaces are flat neutral grey (`#151517`-ish) with no depth between page, panel and card. | `*-dark` | High. Dark is meant to become the default. |
| 5 | **The shell is heavy for what it holds.** A 240 px sidebar carries 4–5 links, a disabled "Templates · SOON" row adds noise, and there's no primary "Create" action anywhere. The credits pill is easy to miss, and the avatar is bare initials. | `home--1280-*`, `uploads--1280-*` | Medium-high |
| 6 | **Settings is one long stack of same-weight cards.** Password change and 2FA are crammed into one "Security" card. The disabled "Delete account" button is low-contrast pink on pink. "Plan & credits" is a sentence, not a widget. | `settings--1280-dark` | Medium |
| 7 | **The admin table wraps controls onto 2 lines per row**, so 50 users make a 4600 px page. The role and plan selects, grant input and Ban button are cramped, and the search button repeats the placeholder text. | `admin--1280-light` | Medium (internal tool) |
| 8 | **Auth is a small card floating in emptiness.** There's no brand moment. "Email me a sign-in link" looks disabled until an email is typed, though it isn't explained. | `sign-in--1280-light` | Medium |
| 9 | **The uploads dropzone and URL import compete.** The secondary action (URL) gets a full labelled field with the same weight as the main dropzone, and the grid has no hover affordance until you find the hidden delete button. | `uploads-filled--*` | Medium |
| 10 | **Mobile:** the bottom nav works, but the active state is only colored text (color as the sole indicator), and the tool cards on landing stack into a long same-y list. | `*--375-*` | Medium |
| 11 | **Copy is serviceable but flat:** "Create scroll-stopping visuals" is generic, and "Describe it, get it." is a feature description, not a benefit. | landing | Low-medium |
| 12 | The Next.js dev indicator ("N") overlaps content in screenshots. It's dev only, and gets disabled for capture runs. | all | Tooling |

**Contrast:** no failing body text was spotted visually. Disabled tiles at 60% opacity are exempt from AA, but they shouldn't be the main content of a screen (issue 2). A measured axe and contrast pass is in Phase F.

---

## 3. Direction: "Aurora Studio", grounded in light

**Product interpretation.** PixelForge is a browser studio where people who aren't designers turn photos and ideas into publish-ready visuals. The emotional promise is *transformation*: you put something ordinary in, and something luminous comes out.

**Organising metaphor: light.** Photo editing *is* light manipulation: exposure, relighting, color grading, cutting a subject out of its background. So the brief's aurora is not decoration here. It is the visual language for "PixelForge did something to your image". **Rule: aurora color appears where transformation happens** (AI actions, the primary CTA, before/after reveals, generating states). Everything else stays calm and near-monochrome. This keeps the gradient meaningful rather than wallpaper, and it keeps the page from looking like every other purple-gradient AI site.

### Palette (dark default)

| Token | Hex | Role |
|---|---|---|
| Void `bg-0` | `#07070D` | page |
| Night `bg-1` / `bg-2` / `bg-3` | `#0D0D18` / `#14142A` / `#1C1C38` | panels / cards / raised |
| Starlight `text-1` | `#F5F6FF` | primary text |
| Haze `text-2` / `text-3` | `#A7A9C7` / `#6B6E8F` | secondary / muted (muted only at ≥ 14 px medium, verified in Phase F) |
| **Aurora** | `#7C5CFF → #2DA8FF → #2EF2C9` | transformation, primary CTA, focus ring |
| Flare (premium only) | `#FF5CA8 → #FFB35C` | premium badge and upsell *only* |

⚠ **Brand-distance note.** Picsart's identity is a purple-to-pink/magenta gradient. The brief's palette pairs violet with a pink warm pop, which drifts toward it. My recommendation is to keep the aurora **cool** (violet → blue → mint, which no major competitor owns) and confine the pink/orange "Flare" to premium badges, so the two gradients never touch. This replaces the current ember orange; the logo mark gets redrawn in aurora.

Light theme: `#F7F7FC` page, white cards, the same aurora and flare, and shadows instead of glow.

### Typography

| Role | Face | Why |
|---|---|---|
| Display (hero, page titles, big numbers) | **Clash Display** (Fontshare, free commercial licence, self-hosted with `next/font/local`) | Sharp, slightly condensed, characterful. It reads "creative tool" without being cute. Fallback: Sora (OFL) if you want OFL-only fonts |
| UI and body | **Geist** | More personality than Inter, and excellent at small UI sizes |
| Mono (prompts, shortcuts, credits) | **Geist Mono** | Pairs natively with Geist |

The scale is fluid via `clamp()`: hero 44 → 88 px, H1 32 → 48, H2 24 → 32, body 15/16, small 13. Display text gets −2% tracking, and body line-height is 1.55. Gradient text is reserved for one hero keyword and key numbers (credits).

### Shape, depth and motion

- **Radius:** 8 inputs · 12 buttons · 20 cards · 28 hero and feature panels · full for chips and avatars. Deliberately **not** one radius everywhere.
- **Depth through light, not shadow.** In dark mode, layers separate by surface step plus a 1 px top inner highlight. Glow is reserved for aurora elements.
- **Glass is only for floating UI** (top nav after scroll, popovers, ⌘K, editor floating toolbar).
- **Background atmosphere** is one slow aurora mesh behind the hero and the final CTA only, never behind working UI. It's a static gradient under `prefers-reduced-motion`.
- **Motion:** `motion` (Framer Motion) with spring 300/30 for UI and `cubic-bezier(.22,1,.36,1)` for entrances. There's one orchestrated hero sequence. Everything else is user-triggered (hover lift, press, layout transitions), with no fade-up on every section.

### Signature idea: the light sweep

A band of aurora light that **transforms whatever it passes over**. On the landing hero it sweeps across a photo: on one side the original, on the other the edited version (background removed and relit, color graded). The user can **grab the band and drag it**, so it is a before/after slider, which demonstrates the product rather than describing it.

The same motif recurs where it means something: the AI "generating" state (the band sweeps across a skeleton), the primary button's hover (a sheen passes through), and the before/after comparison in the editor. One idea, used consistently.

---

## 4. Three hero concepts

**A. Light Sweep (recommended).** An asymmetric split. Text sits left at 5/12: headline, one sentence, a prompt/upload bar, and a single CTA. A large photo "canvas" sits right at 7/12, tilted a few degrees, with the draggable aurora band and two or three small editor chips attached to it ("Remove background", "Relight", "Expand") that change what the sweep reveals. Mobile stacks the canvas first, full-bleed, with the text below. *Memorable for:* touching the product in the first viewport.
```
┌───────────────────────────────────────────────────────────┐
│ ◆ PixelForge   Tools  Templates  AI  Pricing   ⌘K  [Create]│
├──────────────────────┬────────────────────────────────────┤
│ Turn any photo       │   ╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲   │
│ into something       │  │ original  ┃▓ edited (glow)   │  │
│ that *glows*.        │  │  photo    ┃▓ bg removed,     │  │
│                      │  │           ┃▓ relit           │  │
│ [ ✦ Describe or drop │  │      ⇆ drag the light       │  │
│   an image…    → ]   │   ╲____________________________╱   │
│ Start free · no card │   (Remove bg) (Relight) (Expand)   │
└──────────────────────┴────────────────────────────────────┘
```

**B. Prompt-first.** A giant centered prompt field is the hero, and a row of results "develops" below it (shimmer → image). This is the strongest AI story, but AI generation ships in Phase 4, so today it would be a staged fake. It's also the most common AI-product hero right now.

**C. Live mini-studio.** The hero *is* a small working canvas where you drag stickers or text onto a poster. It's the most interactive, but it's heavy (it loads canvas code on the marketing page, which threatens the LCP < 2.5 s budget) and it duplicates the real editor before that exists.

**Recommendation: A.** It's honest about what exists, product-specific, light on performance (one image pair plus CSS mask, with no canvas library), and it seeds the motif reused across the app.

---

## 5. How the direction lands on existing screens (Phase C preview)

- **Shell:** the 240 px sidebar becomes a **64 px icon rail with labels on hover/expand** plus a slim top bar holding search (⌘K), a credits meter (an aurora ring with the number in Geist Mono), the **Create** aurora button and an avatar. Unbuilt destinations are hidden rather than shown disabled.
- **Home:** a greeting in display type, then a quick-create row that shows only working actions and adds an honest "next up" teaser card. **Uploads move onto Home** as "Your library" until projects exist, so the screen is never empty.
- **Auth:** a split screen. The form sits on the left; the right shows the light sweep slowly running over a photo, so the brand moment is reused rather than new art.
- **Settings:** a left section nav (Profile · Appearance · Security · Data). Each section is a calm card, 2FA becomes its own row with a status pill, and the plan becomes a credit-meter widget.
- **Admin:** dense table rows with controls moved into a row action menu and a side sheet. Search becomes a single input.

## 6. Things in the brief I recommend changing or deferring

| Brief item | Recommendation | Why |
|---|---|---|
| Trust strip with placeholder brands, live counters, testimonials, community showcase | **Don't ship fake ones.** Use real proof slots (interactive demos, feature showcases) and add these sections once real data exists | Fabricated logos, counts and quotes mislead users and create legal risk. Placeholders tend to ship by accident |
| Mega-menu items Video / Community / Pricing | Show only built destinations, plus Pricing as a waitlist page | Links to non-existent features read as broken |
| Phase D "redesign the editor" | Design the editor chrome **as part of building it** in roadmap Phase 2, following this system | There's no editor yet to redesign |
| Storybook | A dev-only `/design-system` route instead | Same coverage with no extra toolchain. Storybook can come later if a second app consumes `ui` |
| Glass everywhere / animated mesh behind sections | Glass only for floating UI. Aurora mesh only behind the hero and final CTA | Performance budget, and keeps the effect meaningful |

## 7. Open questions (need your call before Phase B)

1. **Palette:** approve the cool aurora with Flare confined to premium (my recommendation), or use the brief's palette exactly as written?
2. **Social proof:** OK to omit fake brands, testimonials and counters until real ones exist?
3. **Hero imagery:** the light sweep needs 2–3 original photo pairs (before and after). Should I generate original images with an AI image tool, or use Unsplash-licensed photos (free commercial use, attribution recorded)? Pure SVG placeholders work technically, but they would undercut the hero.
