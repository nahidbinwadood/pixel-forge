# Design changelog

## 2026-10-07: Aurora Studio redesign (Phases B + C)
Screens were reviewed at 375/768/1280/1920 px in both themes (working screenshots are not kept in the repo).

- **Foundation:**
  - Aurora tokens, dark by default, AA contrast, with the muted text lifted from the brief's value.
  - Clash Display / Geist / Geist Mono fonts.
  - Motion system (`lib/motion.ts`, `LazyMotion` + `MotionConfig reducedMotion="user"`).
  - Buttons with the light-sweep sheen, plus a loading state.
- **Forms:** the `components/form/*` library (Input, Password with eye toggle + rules, Textarea, Select, Combobox, Checkbox, Switch, RadioGroup, Slider, Submit, RootError). The password policy is enforced on both client and server.
- **Signature element:** `LightSweep`, a draggable, keyboard-accessible before/after with real edits (Vivid/Film/Mono), used on landing, auth and home.
- **Shell:** 64 px icon rail, top bar with ⌘K command palette, credit meter, Create button, and a mobile bottom nav whose active state uses a shape, not just color.
- **Screens:**
  - **Landing:** light-sweep hero, honest tool bento (unbuilt tools marked "Coming soon"), "How it works", showcase, FAQ and final CTA. No fake social proof.
  - **Auth:** split layout; every form uses react-hook-form + zod.
  - **Home:** only working actions, an editor teaser and the library.
  - **Uploads:** dropzone hero, URL import moved into a disclosure, animated grid.
  - **Settings:** section nav and calm cards.
  - **Admin:** dense table with a manage side panel; flags as cards; health status cards.
  - **`/design-system`:** dev-only page showing every component.
- **Fixed along the way:**
  - The active chip rendered behind its card (stacking context).
  - `(app)/loading.tsx` made `/admin` return 200 instead of 404 for non-admins, so loading skeletons are now per segment.

## 2026-10-07: Redesign v2 (user feedback; references CherryMockup, cherrypdf, Picsart)
- **Type and buttons:** Bricolage Grotesque display font, light default theme, pill buttons (solid violet primary; aurora reserved for transformation/AI).
- **Landing page rebuilt:**
  - Pill-group navigation.
  - Centered hero with the keyword in a crop-tool frame, a drop card, honest checkmarks and floating edited photos.
  - Tool bento built on real photos.
  - "One photo. Every mood." rail of real preset edits.
  - Light-sweep feature.
  - "How it works" panel with an app-window mock.
  - Dark "Sized for every feed" band.
  - "Your photos stay yours" privacy section (real Phase 1 features).
  - FAQ, final CTA and a large footer.
- **Housekeeping:** removed working screenshots, the screenshot script, and unused UI components.
