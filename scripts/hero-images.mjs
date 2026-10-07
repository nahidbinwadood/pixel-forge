// Builds the landing/auth hero images: untouched originals + real edits (the same adjustment types the editor offers).
// Usage: node scripts/hero-images.mjs <srcDir>   (src = Unsplash downloads, see docs/design/ASSETS.md)
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../apps/worker/package.json", import.meta.url));
const sharp = require("sharp");
const src = process.argv[2];
const out = fileURLToPath(new URL("../apps/web/public/hero/", import.meta.url));

const vignette = (w, h, strength) =>
  Buffer.from(
    `<svg width="${w}" height="${h}"><defs><radialGradient id="v" cx="50%" cy="50%" r="75%">` +
      `<stop offset="55%" stop-color="black" stop-opacity="0"/><stop offset="100%" stop-color="black" stop-opacity="${strength}"/>` +
      `</radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`,
  );

const presets = {
  // Punchy color + local contrast
  vivid: (img) => img.modulate({ saturation: 1.35, brightness: 1.04 }).linear(1.12, -10).sharpen({ sigma: 0.8 }),
  // Lifted blacks, warm highlights, cool shadows, softer saturation
  film: (img) =>
    img
      .modulate({ saturation: 0.85 })
      .recomb([
        [1.08, 0.04, 0],
        [0.02, 1.0, 0.02],
        [0, 0.08, 0.88],
      ])
      .linear(0.86, 22),
  // High-contrast black & white
  mono: (img) => img.grayscale().linear(1.25, -26),
};

const sources = [
  { file: "F2UvQ-iIqqA.jpg", name: "lake", width: 1600, height: 1200 },
  { file: "6NHivat8d4w.jpg", name: "beach", width: 1200, height: 1500 },
];

for (const s of sources) {
  const base = () => sharp(join(src, s.file)).resize(s.width, s.height, { fit: "cover", position: "attention" });
  await base()
    .webp({ quality: 82 })
    .toFile(join(out, `${s.name}-original.webp`));
  for (const [preset, fn] of Object.entries(presets)) {
    const edited = await fn(base()).toBuffer();
    await sharp(edited)
      .composite([{ input: vignette(s.width, s.height, preset === "mono" ? 0.45 : 0.3) }])
      .webp({ quality: 82 })
      .toFile(join(out, `${s.name}-${preset}.webp`));
  }
  console.warn(`built ${s.name}`);
}
