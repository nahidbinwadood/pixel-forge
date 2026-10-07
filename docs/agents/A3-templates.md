# A3: Templates & content libraries (roadmap Phase 3). Agent number N=3

Goal: browse, search and use templates, plus sticker, font and stock libraries. Read `docs/PRD.md` (templates + libraries epics), `docs/DATA_MODEL.md`, and the Template, TemplateCategory, Font, Favorite and RecentUse models in `schema.prisma`.

You own:
- `apps/web/app/(app)/templates/**`, `apps/web/app/(app)/admin/templates/**` (add a tab link in the admin tabs)
- `apps/web/app/api/v1/{templates,template-categories,stickers,fonts,stock,favorites,recents,search}/**`
- `apps/web/components/templates/**`, `apps/web/lib/templates.ts`
- seed additions in `packages/db/src/seed.ts`, and the namespace `templates`

Notes:
- Projects are created via Prisma directly. The editor (A1) is built in parallel, so "Use template" creates a `Project` from the template document (validated with `migrate()`) and redirects to `/editor/<id>`. That route exists after merge; just link to it.
- Full-text search: add a `searchVector` tsvector column to Template via `Unsupported("tsvector")` + a GIN index (`@@index(..., type: Gin)`) and keep it updated. Simplest is computing it in app code on create/update with `$executeRaw`, or a generated column if `db push` supports it. Document your choice.

Build:
1. **Seed:** 24+ original templates across all 6 categories and real size presets. Use only `editor-core` node types (text/shape/image using existing `/hero/*` photos uploaded as global assets in seed, or shapes + gradients). Make them good-looking: bold Bricolage-style typography (`fontFamily` "Bricolage Grotesque"/"Geist"), real compositions, nothing lorem ipsum. Also seed 40+ original SVG stickers (simple geometric/emoji-free shapes, stored as global `Asset(kind=sticker)` from SVG strings) and the font list.
2. **`/templates`:**
   - Sticky search + filter chips (category, size preset, style, color, free/premium).
   - Masonry grid with Framer Motion layout animations, infinite scroll (cursor), skeletons, and empty/error states.
   - Hover preview with "Use template", plus a premium badge (premium for free users shows the waitlist paywall).
   - Detail modal with similar templates. Add a nav item and make Home's "Pick a template" real.
   - Template previews: render each template document to a static preview. Simplest correct option is a lightweight SVG renderer of the document (text/shape/image nodes) used for thumbnails.
3. **Admin:** templates list/create/edit (JSON document + metadata via Form* components, and "Save from project id"), plus publish/unpublish. Every mutation writes an audit log.
4. **APIs:** stickers, fonts, favorites (POST/DELETE/GET) and recents.
   - `stock/photos` proxies Unsplash when `UNSPLASH_ACCESS_KEY` is set, otherwise returns 503 with a clear message (no fake results).
   - Global `search?q=&types=` across templates, your designs and uploads.
5. **E2E** `e2e/templates.spec.ts`: search → filter → open detail → Use template creates a project (assert the redirect URL + DB row via API).
