# Backlog

Items deferred out of a phase or referenced by a TODO in code. Format: `B-<n> · <title> · <phase> · <why deferred>`.

- ~~B-1 · Create `apps/worker` with upload processing + thumbnails~~ · done Phase 1
- B-2 · Create `packages/ai` (AIProvider + mock) · Phase 4 · no consumers before AI phase
- ~~B-3 · Playwright E2E setup + first auth flow test~~ · done Phase 1
- B-4 · Template `tsvector` column + GIN index (raw SQL migration) · Phase 3
- B-5 · Server-side watermark/render for exports (closes RISKS R6) · V2
- B-6 · WebGL filter pipeline replacing Konva CPU filters (D7 ceiling) · V2
- B-7 · Turborepo if CI > ~5 min (D3) · when needed
- B-8 · Confirm free-tier credit amount + per-tool costs before beta (PRD open question) · before week 11
- B-9 · Verify HEIC upload with a real iPhone sample (code path exists, untested: no sample file) · before beta
- B-10 · Purge job: hard-delete users 30 days after `deletedAt` (+ their storage objects) · Phase 4 (worker cron)
- B-11 · Cleanup job: delete `pending` assets older than 24 h (presigned but never completed) · Phase 4 (worker cron)
- B-12 · GDPR export as worker job + emailed link, including original files · when exports get large
- B-13 · Configure R2 bucket CORS (PUT/GET from APP_URL) in the deploy runbook · Phase 11
- B-14 · Sentry wiring (web + worker) · Phase 11
- B-15 · Monthly credit grant cron (signup grant exists; recurring grant does not) · Phase 4
- B-16 · Service worker + offline caching · Phase 2 (with editor offline mode)
- B-A1-1 · Full-resolution export: load each image's original (not the 1600 px preview) when exporting above preview size · Phase 6
- B-A1-2 · Purge designs that sit in trash for 30 days (worker cron) + a Trash view to restore them · Phase 3
- B-A1-3 · Multi-page designs in the editor UI (the document model already supports pages; the UI edits page 1) · Phase 6
- B-A1-4 · Sticker/stock library in the Elements panel (sticker nodes render as placeholders until then) · Phase 3
