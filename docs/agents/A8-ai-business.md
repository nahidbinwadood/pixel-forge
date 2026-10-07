# A8: Phase 6b AI expansion + Phase 10 business (sonnet)

Builds on A2's AI layer (`packages/ai`, `apps/web/lib/ai/*`, `apps/web/lib/jobs/ai/process-ai.ts`, `/ai`). Every tool is a credit-metered AI job; add each cost to `plans.ts`. The only provider is Gemini, with a mock for tests.

## Scope
1. **AI tools (Gemini image edit):** background replace/generate, object remove (mask + prompt), AI replace (region + prompt), expand/outpaint (pad canvas + instruction), upscale/enhance. The mask comes from a simple brush-on-image UI in the tool page. Each tool:
   - has its own `/ai/<tool>` page
   - goes through moderation
   - writes `ai_output` assets
   - has "Open in editor"
2. **AI Writer extras:** prompt favorites already exist. Add "remix this prompt" from history.
3. **Brand Kit:**
   - `BrandKit` per workspace: logos (assets), colors, fonts.
   - Settings page plus an editor panel to apply them. Coordinate only through the documented editor-core commands; don't edit editor internals.
   - If the panel needs an editor hook, add one small additive export and report it.
4. **Product photo tools:** "white background + soft shadow" and "studio scene" presets, built on bg_remove + compositing with sharp in the job.
5. **Public REST API:**
   - `ApiKey` model (hashed, shown once, per workspace) and a settings UI to create and revoke keys.
   - `Authorization: Bearer pk_...` on `/api/v1/*` read endpoints, plus AI job create, with per-key quotas (Postgres rate limit) and a usage page.
   - Update `docs/API_SPEC.yaml`.
6. **Analytics dashboard (admin):** signups, AI jobs, credits spent, export counts, from DB aggregates (no fake numbers).

## Out of scope (BACKLOG with reason)
Social scheduler/direct publish (needs per-network OAuth apps), mockups, the embeddable Editor SDK.

## Files
Owned:
- `apps/web/app/(app)/ai/**` (new tool pages)
- `apps/web/lib/ai/**`, `apps/web/lib/jobs/ai/**`, `packages/ai/**`
- `apps/web/app/(app)/settings/{brand,api-keys}/**`, `apps/web/app/(app)/admin/analytics/**`
- `apps/web/lib/api-keys.ts`
- `e2e/ai-v2.spec.ts`
