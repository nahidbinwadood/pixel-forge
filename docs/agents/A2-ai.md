# A2: AI layer on Gemini (roadmap Phase 4). Agent number N=2

Goal: real AI tools with credits. The **only provider is Google Gemini** (`GEMINI_API_KEY`), plus a `mock` provider for dev and tests (`AI_PROVIDER=mock|gemini`). Read `docs/ARCHITECTURE.md` §3 (job lifecycle) and §5 (credits), `packages/shared/src/plans.ts` and `apps/worker/src/*`.

You own: new `packages/ai/**`, `apps/worker/src/ai/**` + `apps/worker/src/cron/**` (register them in `apps/worker/src/index.ts`), `apps/web/app/(app)/ai/**`, `apps/web/app/api/v1/ai/**`, `apps/web/app/api/v1/credits/ledger/**`, `apps/web/components/ai/**`, and the namespace `ai`.

Build:
1. **`packages/ai`:** capability interfaces `generateImage`, `editImage` (used for background removal: prompt Gemini's image model to return the subject on a transparent/white background, then post-process with sharp in the worker, e.g. making white transparent where needed), `writeText` and `moderate` (text + image safety).
   - Gemini adapter uses the official `@google/genai` SDK. Check the current model IDs in Google's docs with WebFetch. Defaults go in code and can be overridden by `GEMINI_TEXT_MODEL` / `GEMINI_IMAGE_MODEL`.
   - Mock adapter returns deterministic local results.
2. **Jobs:** `POST /api/v1/ai/jobs` follows ARCHITECTURE §3 exactly.
   - Idempotency-Key header, zod, `isEnabled` flag check, rate limit, prompt moderation.
   - Credit check + `job_charge` in one transaction with row lock, then BullMQ queue `ai`.
   - The worker runs the provider (with timeout and retries), moderates the output, stores results as `Asset(kind=ai_output)` with thumbnails, and on failure or block writes a `job_refund`.
   - `GET /api/v1/ai/jobs/[id]` for polling; `GET /api/v1/ai/prompts` for history (`AIJob` rows) plus favorite.
3. **UI:** `/ai` hub (tool cards with credit cost), `/ai/generate` (prompt, style chips, aspect ratio, 1–4 variations), `/ai/remove-background` (pick an upload or upload, before/after LightSweep), `/ai/write` (captions/hashtags/ad copy).
   - Shared layout: left controls, center result, right history.
   - Generating state is an aurora shimmer + progress, with the credit cost shown before running. On 402, show a "not enough credits" paywall card.
   - Results can be downloaded or saved to the library. Add a nav item.
   - Make Home's "Try AI" real.
4. **Credits:** `GET /api/v1/credits/ledger` (paginated) and a usage-history section (a card in settings or `/ai/history`).
5. **Worker crons** (BullMQ repeatable jobs):
   - monthly credit grant (BACKLOG B-15, top-up rule from ARCHITECTURE §5)
   - purge users 30 days after `deletedAt` (B-10)
   - delete `pending` assets older than 24 h (B-11)
   Each is idempotent, and each gets a unit test.
6. **E2E** `e2e/ai.spec.ts` with `AI_PROVIDER=mock`: generate image → credits decrease → result in library; write text; remove background.
