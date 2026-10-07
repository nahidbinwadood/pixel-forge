import { describe, expect, it } from "vitest";
import { keyOutBorderWhite } from "./alpha";

/** 5x5 white canvas with a 3x3 dark ring whose center pixel is white (an "inner white" area). */
function ring(): Uint8Array {
  const w = 5;
  const px = new Uint8Array(w * w * 4).fill(255);
  for (let y = 1; y <= 3; y++) {
    for (let x = 1; x <= 3; x++) {
      if (x === 2 && y === 2) continue;
      const o = (y * w + x) * 4;
      px[o] = 20;
      px[o + 1] = 20;
      px[o + 2] = 20;
    }
  }
  return px;
}
const alphaAt = (px: Uint8Array, x: number, y: number) => px[(y * 5 + x) * 4 + 3];

describe("keyOutBorderWhite", () => {
  it("clears white connected to the border and keeps enclosed white", () => {
    const px = ring();
    const cleared = keyOutBorderWhite(px, 5, 5);
    expect(cleared).toBe(16); // the outer frame
    expect(alphaAt(px, 0, 0)).toBe(0);
    expect(alphaAt(px, 2, 2)).toBe(255); // enclosed white survives
    expect(alphaAt(px, 1, 1)).toBe(255); // dark subject stays opaque
  });

  it("is a no-op on an image with no white border", () => {
    const px = new Uint8Array(4 * 4 * 4).fill(10);
    expect(keyOutBorderWhite(px, 4, 4)).toBe(0);
  });

  it("feathers light edge pixels", () => {
    const px = ring();
    const o = (1 * 5 + 1) * 4;
    px[o] = px[o + 1] = px[o + 2] = 225; // near-white edge pixel of the subject
    keyOutBorderWhite(px, 5, 5);
    const a = alphaAt(px, 1, 1) ?? 0;
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(255);
  });

  it("validates buffer size", () => {
    expect(() => keyOutBorderWhite(new Uint8Array(3), 1, 1)).toThrow(RangeError);
  });
});
