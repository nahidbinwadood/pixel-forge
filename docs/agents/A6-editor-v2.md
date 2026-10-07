# A6: Phase 6a, editor V2 (opus)

Builds on A1's editor (`packages/editor-core`, `apps/web/components/editor/*`, `/editor/[id]`). Read the editor-core command and history design first. The document only changes through commands.

## Scope (PROJECT_BRIEF §2.1, §2.3, V2 items)
1. **Layers, full:** blend modes, opacity, group/ungroup, lock/hide, reorder by drag in the layers panel, and clipping masks (an image clipped to a shape). Bump the schema version with a `migrate()` step and a test.
2. **Adjustments:** curves/levels and an HSL panel as new `Effect` types (Konva custom filters), each with a unit test on a pixel buffer.
3. **Brush tools:** brush, eraser (on a raster layer), and blur/smudge as stretch goals. Strokes are stored as vector paths in the document (non-destructive), not baked pixels.
4. **Selection tools:** rectangle, ellipse and lasso producing a mask. Magic wand is a stretch goal.
5. **Multi-page designs:** a page strip at the bottom with add, duplicate, delete and reorder. Export the current page or all pages (PDF multi-page, PNG as a zip if cheap, otherwise per page).
6. **Magic Resize:** copy a design to another canvas preset, with proportional scaling and re-centering. This creates a new project.
7. **Version history:** the panel lists `ProjectVersion` rows and restores one (A1 has the versions API).
8. **QR generator element:** the `qrcode` dependency is already installed. Insert a QR object with a URL or text input and colors.

## Out of scope
AI tools (A8). Retouch tools that need AI (BACKLOG).

## Files
Owned: `packages/editor-core/**`, `apps/web/components/editor/**`, `apps/web/app/(app)/editor/**`, `e2e/editor-v2.spec.ts`. Also messages in the `editor` namespace.

## Done
Everything in RULES.md. Editor stays at 60 fps with 200 objects (manual check with the perf panel; note the result).
