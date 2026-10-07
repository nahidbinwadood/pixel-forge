import type { Adjustments } from "./document";

/** RGBA pixels, the shape of a canvas ImageData. Edited in place. */
export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type AdjustmentKey = keyof Required<Adjustments>;

/** Slider ranges, in the order the properties panel shows them. */
export const ADJUSTMENT_RANGES: ReadonlyArray<{ key: AdjustmentKey; min: number; max: number }> = [
  { key: "brightness", min: -100, max: 100 },
  { key: "contrast", min: -100, max: 100 },
  { key: "saturation", min: -100, max: 100 },
  { key: "exposure", min: -100, max: 100 },
  { key: "highlights", min: -100, max: 100 },
  { key: "shadows", min: -100, max: 100 },
  { key: "temperature", min: -100, max: 100 },
  { key: "tint", min: -100, max: 100 },
  { key: "vibrance", min: -100, max: 100 },
  { key: "sharpness", min: 0, max: 100 },
  { key: "blur", min: 0, max: 100 },
  { key: "vignette", min: 0, max: 100 },
  { key: "grain", min: 0, max: 100 },
];

export interface FilterPreset {
  id: string;
  label: string;
  premium: boolean;
  adjustments: Adjustments;
}

/** Original looks built only from our own adjustment model (no third-party LUTs). */
export const FILTER_PRESETS: readonly FilterPreset[] = [
  { id: "vivid", label: "Vivid", premium: false, adjustments: { saturation: 35, vibrance: 30, contrast: 15 } },
  {
    id: "film",
    label: "Film",
    premium: false,
    adjustments: { contrast: -15, temperature: 18, saturation: -12, highlights: -20, grain: 18 },
  },
  { id: "mono", label: "Mono", premium: false, adjustments: { saturation: -100, contrast: 12 } },
  { id: "warm", label: "Warm", premium: false, adjustments: { temperature: 35, tint: 6, vibrance: 10 } },
  { id: "cool", label: "Cool", premium: false, adjustments: { temperature: -35, tint: -4, contrast: 6 } },
  { id: "fade", label: "Fade", premium: false, adjustments: { contrast: -35, brightness: 12, saturation: -20 } },
  { id: "punch", label: "Punch", premium: false, adjustments: { contrast: 35, shadows: -15, sharpness: 30 } },
  { id: "pastel", label: "Pastel", premium: false, adjustments: { brightness: 15, contrast: -25, vibrance: -15 } },
  {
    id: "noir",
    label: "Noir",
    premium: true,
    adjustments: { saturation: -100, contrast: 45, shadows: -25, vignette: 55, grain: 25 },
  },
  {
    id: "golden",
    label: "Golden hour",
    premium: true,
    adjustments: { temperature: 45, exposure: 10, highlights: -25, vibrance: 25, vignette: 25 },
  },
];

export function findFilter(id: string | undefined): FilterPreset | undefined {
  return id ? FILTER_PRESETS.find((f) => f.id === id) : undefined;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Manual adjustments plus a filter preset scaled by its intensity (0–1), clamped to each range. */
export function effectiveAdjustments(
  manual: Adjustments,
  filter?: { presetId: string; intensity: number },
): Required<Adjustments> {
  const preset = findFilter(filter?.presetId)?.adjustments ?? {};
  const k = filter ? clamp(filter.intensity, 0, 1) : 0;
  const out = {} as Required<Adjustments>;
  for (const { key, min, max } of ADJUSTMENT_RANGES) {
    out[key] = clamp((manual[key] ?? 0) + (preset[key] ?? 0) * k, min, max);
  }
  return out;
}

export function isNeutral(a: Required<Adjustments>): boolean {
  return ADJUSTMENT_RANGES.every(({ key }) => a[key] === 0);
}

/** Deterministic PRNG so grain doesn't shimmer between re-renders. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Apply photo adjustments to RGBA pixels in place (one CPU pass + optional blur/sharpen passes).
 * Used as a Konva custom filter; pure so it is unit-testable (ASSUMPTIONS D7: WebGL is the V2 upgrade).
 */
export function applyAdjustments(px: Pixels, a: Required<Adjustments>, seed = 1): void {
  if (isNeutral(a)) return;
  if (a.blur > 0) boxBlur(px, Math.round((a.blur / 100) * 12));
  const { data, width, height } = px;
  const exposure = 2 ** ((a.exposure / 100) * 1.5);
  const brightness = (a.brightness / 100) * 0.35 * 255;
  const contrast = 1 + a.contrast / 100;
  const saturation = 1 + a.saturation / 100;
  const warm = (a.temperature / 100) * 30;
  const tint = (a.tint / 100) * 25;
  const grain = (a.grain / 100) * 50;
  const rand = mulberry32(seed);
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.hypot(cx, cy) || 1;

  for (let i = 0; i < data.length; i += 4) {
    let r = (data[i] ?? 0) * exposure + brightness + warm;
    let g = (data[i + 1] ?? 0) * exposure + brightness - tint;
    let b = (data[i + 2] ?? 0) * exposure + brightness - warm;

    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    const lum = clamp((0.299 * r + 0.587 * g + 0.114 * b) / 255, 0, 1);
    const tone = ((a.shadows / 100) * (1 - lum) ** 2 + (a.highlights / 100) * lum ** 2) * 80;
    r += tone;
    g += tone;
    b += tone;

    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    const s = saturation * (1 + (a.vibrance / 100) * (1 - clamp(sat, 0, 1)));
    r = l + (r - l) * s;
    g = l + (g - l) * s;
    b = l + (b - l) * s;

    if (a.vignette > 0) {
      const p = i / 4;
      const d = Math.hypot((p % width) - cx, Math.floor(p / width) - cy) / maxDist;
      const t = clamp((d - 0.35) / 0.65, 0, 1);
      const v = 1 - (a.vignette / 100) * 0.8 * t * t * (3 - 2 * t);
      r *= v;
      g *= v;
      b *= v;
    }
    if (grain > 0) {
      const n = (rand() - 0.5) * grain;
      r += n;
      g += n;
      b += n;
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  if (a.sharpness > 0) sharpen(px, a.sharpness / 100);
}

/** Separable box blur on RGB (alpha untouched). */
export function boxBlur(px: Pixels, radius: number): void {
  if (radius < 1) return;
  const { data, width, height } = px;
  const tmp = new Float32Array(data.length);
  const pass = (src: ArrayLike<number>, dst: { [i: number]: number }, horizontal: boolean) => {
    const outer = horizontal ? height : width;
    const inner = horizontal ? width : height;
    for (let o = 0; o < outer; o++) {
      for (let c = 0; c < 3; c++) {
        const at = (k: number) => {
          const q = clamp(k, 0, inner - 1);
          return ((horizontal ? o * width + q : q * width + o) << 2) + c;
        };
        let sum = 0;
        for (let k = -radius; k <= radius; k++) sum += src[at(k)] ?? 0;
        for (let k = 0; k < inner; k++) {
          dst[at(k)] = sum / (2 * radius + 1);
          sum += (src[at(k + radius + 1)] ?? 0) - (src[at(k - radius)] ?? 0);
        }
      }
    }
  };
  for (let i = 3; i < data.length; i += 4) tmp[i] = data[i] ?? 0;
  pass(data, tmp, true);
  pass(tmp, data, false);
}

/** Unsharp-style 3×3 sharpen with strength 0–1. */
export function sharpen(px: Pixels, amount: number): void {
  const { data, width, height } = px;
  const src = Uint8ClampedArray.from(data);
  const k = amount * 1.5;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[i + c] ?? 0;
        const around =
          (src[i - 4 + c] ?? 0) + (src[i + 4 + c] ?? 0) + (src[i - width * 4 + c] ?? 0) + (src[i + width * 4 + c] ?? 0);
        data[i + c] = center + k * (4 * center - around);
      }
    }
  }
}
