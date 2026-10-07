# Asset provenance

| File(s) | Source | Author / license | Processing |
|---|---|---|---|
| `apps/web/public/hero/lake-*.webp` | https://unsplash.com/photos/F2UvQ-iIqqA | Unsplash License (free commercial use, no attribution required — credited here anyway) | `scripts/hero-images.mjs`: cropped 1600×1200; `-original` untouched; `-vivid`, `-film`, `-mono` are real edits (saturation, tone curve, color matrix, grayscale, vignette) |
| `apps/web/public/hero/beach-*.webp` | https://unsplash.com/photos/6NHivat8d4w | Unsplash License | same script, 1200×1500 |
| `apps/web/app/fonts/ClashDisplay-*.woff2` | Fontshare | ITF Free Font License (see `app/fonts/LICENSE.md`) | none |
| Geist / Geist Mono | Google Fonts via `next/font` | SIL OFL 1.1 | none |

Rules: no Picsart/Canva assets; no visible third-party logos or trademarks in marketing imagery; photos of people must be appropriate for a general-audience homepage. Regenerate hero edits with `node scripts/hero-images.mjs <dir-with-unsplash-originals>`.
