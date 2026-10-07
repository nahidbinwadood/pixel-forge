import { describe, expect, it } from "vitest";
import {
  applyAdjustments,
  boxBlur,
  effectiveAdjustments,
  FILTER_PRESETS,
  findFilter,
  isNeutral,
  type Pixels,
  sharpen,
} from "./adjust";
import { createDocument, parseNode } from "./document";
import { cropForRatio, exportFileName, exportSize, formatBytes, premiumFiltersUsed, watermarkLayout } from "./export";

const solid = (w: number, h: number, rgb: [number, number, number]): Pixels => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) data.set([...rgb, 255], i);
  return { data, width: w, height: h };
};
const neutral = effectiveAdjustments({});
const px = (p: Pixels, i = 0) => Array.from(p.data.slice(i * 4, i * 4 + 4));

describe("effective adjustments", () => {
  it("adds the preset scaled by intensity and clamps", () => {
    expect(isNeutral(neutral)).toBe(true);
    const a = effectiveAdjustments({ saturation: 90 }, { presetId: "vivid", intensity: 0.5 });
    expect(a.saturation).toBe(100);
    expect(a.contrast).toBe(7.5);
    expect(effectiveAdjustments({}, { presetId: "unknown", intensity: 1 })).toEqual(neutral);
    expect(findFilter(undefined)).toBeUndefined();
    expect(FILTER_PRESETS.length).toBeGreaterThanOrEqual(9);
  });
});

describe("applyAdjustments", () => {
  it("is a no-op when neutral", () => {
    const p = solid(2, 2, [10, 20, 30]);
    applyAdjustments(p, neutral);
    expect(px(p)).toEqual([10, 20, 30, 255]);
  });
  it("brightens, desaturates and warms", () => {
    const bright = solid(2, 2, [100, 100, 100]);
    applyAdjustments(bright, { ...neutral, brightness: 50, exposure: 20 });
    expect(px(bright)[0]).toBeGreaterThan(140);
    const mono = solid(2, 2, [200, 50, 50]);
    applyAdjustments(mono, { ...neutral, saturation: -100 });
    const [r, g, b] = px(mono);
    expect(r).toBe(g);
    expect(g).toBe(b);
    const warm = solid(1, 1, [128, 128, 128]);
    applyAdjustments(warm, { ...neutral, temperature: 100, tint: 50, contrast: 20, highlights: 20, shadows: 20 });
    expect((px(warm)[0] ?? 0) > (px(warm)[2] ?? 0)).toBe(true);
    const vib = solid(1, 1, [120, 100, 100]);
    applyAdjustments(vib, { ...neutral, vibrance: 100 });
    expect(px(vib)[0]).toBeGreaterThan(120);
  });
  it("darkens corners with vignette and adds deterministic grain", () => {
    const v = solid(9, 9, [200, 200, 200]);
    applyAdjustments(v, { ...neutral, vignette: 100 });
    expect(px(v, 0)[0]).toBeLessThan(px(v, 40)[0] ?? 0);
    const g1 = solid(4, 4, [128, 128, 128]);
    const g2 = solid(4, 4, [128, 128, 128]);
    applyAdjustments(g1, { ...neutral, grain: 100 }, 7);
    applyAdjustments(g2, { ...neutral, grain: 100 }, 7);
    expect(Array.from(g1.data)).toEqual(Array.from(g2.data));
    expect(new Set(Array.from(g1.data)).size).toBeGreaterThan(2);
  });
  it("blurs and sharpens edges", () => {
    const edge = solid(6, 1, [0, 0, 0]);
    edge.data.set([255, 255, 255, 255], 12);
    boxBlur(edge, 1);
    expect(px(edge, 2)[0]).toBe(85);
    expect(px(edge, 3)[3]).toBe(255);
    boxBlur(edge, 0);
    const s = solid(3, 3, [100, 100, 100]);
    s.data.set([150, 150, 150, 255], 16);
    sharpen(s, 1);
    expect(px(s, 4)[0]).toBe(255);
    const both = solid(5, 5, [50, 60, 70]);
    applyAdjustments(both, { ...neutral, blur: 50, sharpness: 50 });
    expect(px(both, 12)[0]).toBe(50);
  });
});

describe("export helpers", () => {
  it("caps the longest edge at the plan limit", () => {
    expect(exportSize({ width: 1080, height: 1920 }, 1, 2048)).toEqual({
      width: 1080,
      height: 1920,
      pixelRatio: 1,
      capped: false,
    });
    const big = exportSize({ width: 1080, height: 1920 }, 2, 2048);
    expect(big).toMatchObject({ height: 2048, width: 1152, capped: true });
  });
  it("lays out the watermark and names files", () => {
    expect(watermarkLayout(1000, 500)).toEqual({ fontSize: 16, margin: 14, x: 986, y: 486 });
    expect(watermarkLayout(100, 100).fontSize).toBe(11);
    expect(exportFileName("Summer Sale! Été", "png")).toBe("summer-sale-ete.png");
    expect(exportFileName("!!!", "pdf")).toBe("design.pdf");
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(200 * 1024)).toBe("200 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
  it("finds premium filters in use", () => {
    const doc = createDocument(10, 10);
    const img = (presetId: string, intensity = 1) =>
      parseNode({
        id: presetId,
        type: "image",
        assetId: "a",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        filter: { presetId, intensity },
      });
    const page = { ...doc.pages[0], nodes: [img("noir"), img("vivid"), img("golden", 0)] };
    expect(premiumFiltersUsed({ ...doc, pages: [page as (typeof doc.pages)[0]] })).toEqual(["noir"]);
  });
  it("computes crops for a ratio with zoom and pan", () => {
    expect(cropForRatio({ width: 200, height: 100 }, 1)).toEqual({ x: 0.25, y: 0, width: 0.5, height: 1 });
    expect(cropForRatio({ width: 100, height: 200 }, 1)).toEqual({ x: 0, y: 0.25, width: 1, height: 0.5 });
    expect(cropForRatio({ width: 100, height: 100 }, null, 2, 1, -1)).toEqual({
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.5,
    });
  });
});
