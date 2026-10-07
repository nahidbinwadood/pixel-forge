# A7: Phase 7, video editor (opus)

A new area at `/video` and `/video/[id]`. It runs **entirely in the browser**: Vercel functions can't run FFmpeg renders, so export is client-side.

## Scope (PROJECT_BRIEF §2.5)
1. **Model:** a video project is a `Project` with `type: "video"` and a JSON timeline document:
   - Tracks: video, image, text, audio.
   - Clips carry in/out, start, speed and volume, plus opacity/scale/position keyframes.
   - Keep the timeline model and its operations pure TS, with Vitest coverage ≥ 80%, in `packages/editor-core/src/video/`.
2. **Uploads:** video and audio go through the existing presigned upload flow. Extend MIME sniffing for MP4/WebM/MP3/WAV/M4A. Server-side, only validate the signature and size (no transcoding). Thumbnails come from the client (first frame → `/api/v1/projects/:id/thumbnail`).
3. **UI:**
   - Preview player (canvas compositor).
   - Multi-track timeline with scrubbing, trim, split, merge, move and snap.
   - Text overlays with styles; transitions (fade, slide); filters (reuse the photo effects).
   - Speed and reverse (reverse is optional if costly).
4. **Audio:** music from the user's uploads, volume and fade in/out, and voiceover recording (MediaRecorder).
5. **Auto-captions:**
   - Extract audio client-side and upload it.
   - Run a new AI tool `captions` (Gemini audio transcription with timestamps) through the existing AI job flow and credit ledger.
   - Add its credit cost in `packages/shared/src/plans.ts`, and the provider method in `packages/ai` with a mock implementation.
   - Captions become text clips.
6. **Export:**
   - MP4/WebM via WebCodecs + `mp4-muxer`/`webm-muxer` (or ffmpeg.wasm if needed; lazy-load it).
   - GIF for short clips.
   - Resolution capped by plan (720p free, 1080p plus, 4K pro), with the free watermark.
   - Progress UI, and Cancel.
7. **Templates/slideshow:** "slideshow from images" quick-start (images → clips with transitions).

## Files
Owned: `apps/web/app/(app)/video/**`, `apps/web/components/video/**`, `packages/editor-core/src/video/**`, `e2e/video.spec.ts`, `messages/en/video.json`. Also additive changes in `packages/ai` (captions), `plans.ts`, `lib/jobs/sniff.ts` and the upload validation.

## Honesty
If the browser lacks WebCodecs, say so and offer WebM via MediaRecorder or a "use Chrome/Edge" message. Never fake progress.
