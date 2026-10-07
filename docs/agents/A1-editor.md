# A1: Core editor (roadmap Phase 2). Agent number N=1

Goal: a working design/photo editor, with saved projects and export. Read `docs/PRD.md` E3 + the export stories, `docs/ARCHITECTURE.md` §2 (document model) and §4 (export), and `packages/editor-core/src/*`.

You own: `packages/editor-core/**`, `apps/web/app/(editor)/**` (full-bleed layout, no app shell), `apps/web/app/(app)/projects/**` (My Designs), `apps/web/app/api/v1/projects/**`, `apps/web/components/editor/**`, and the namespace `editor`.

Build:
1. **editor-core** (pure TS, ≥ 90% coverage):
   - Commands for add, update, remove, reorder, group/ungroup, duplicate, align/distribute, lock/hide.
   - History with Immer patches (undo/redo, cap 100).
   - Selectors.
   - Size presets: Instagram post/story, FB, YouTube thumbnail, TikTok, LinkedIn, X, Pinterest, A4, poster, custom. Put them in `shared` too if the UI needs them.
2. **Projects API** (`/api/v1/projects` CRUD, `/[id]/versions`, `/[id]/duplicate`):
   - Optimistic `revision`; a stale save returns 409.
   - Validate every save with `migrate()`.
   - Thumbnail: the client uploads a PNG via the existing uploads presign flow, or just stores a data-URL-free key. Pick the simplest correct option.
3. **Editor UI** at `/editor/[id]`:
   - Konva + react-konva, loaded via `next/dynamic` with `ssr:false`.
   - Slim top bar: name, undo/redo, zoom, export.
   - Icon-first left rail with flyouts: Uploads (reuse the existing assets API), Text, Shapes, Elements, Layers.
   - Canvas with zoom/pan, snapping guides and a transformer.
   - Context-aware right properties panel (FormSlider etc.), a floating selection toolbar, and a keyboard-shortcuts overlay (`?`).
4. **Photo adjustments + filters:** Konva filters per `Adjustments`, filter presets (Vivid/Film/Mono plus about 6 more) with an intensity slider, crop/rotate/flip, a before/after toggle.
5. **Autosave:** 2 s debounce, plus an IndexedDB mirror for crash recovery and a "Saved / Saving / Offline" indicator.
6. **Export dialog:**
   - PNG/JPG/WebP/PDF (`pdf-lib`) and size within `plan.maxExportPx`.
   - Watermark when `plan.watermark` is on.
   - Live file-size estimate.
   - `track("export_completed")`.
7. **My Designs** (`/projects`): grid, search, rename, duplicate, delete (trash), and "New design" with the size-preset picker.
   - Wire Home's "Start from scratch" to it, and replace the Home "Coming next: the editor" teaser with real recent designs.
   - Add a nav item.
8. **E2E** `e2e/editor.spec.ts`: create design → add text → change color → undo/redo → reload (persisted) → export PNG (download event).
