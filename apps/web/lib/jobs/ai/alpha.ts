/**
 * Background keying for AI background removal. The image model returns the subject on pure white; we flood-fill
 * near-white pixels *connected to the image border* to transparent, so white areas inside the subject (a white
 * shirt, teeth) survive. Pixels on the edge of the fill get partial alpha for a soft cut-out.
 *
 * Works in place on raw RGBA (sharp `.ensureAlpha().raw()`).
 */
export function keyOutBorderWhite(rgba: Uint8Array, width: number, height: number, threshold = 238): number {
  const n = width * height;
  if (rgba.length !== n * 4) throw new RangeError("rgba length must be width*height*4");
  const isBg = (p: number) => {
    const o = p * 4;
    return (rgba[o] ?? 0) >= threshold && (rgba[o + 1] ?? 0) >= threshold && (rgba[o + 2] ?? 0) >= threshold;
  };
  const seen = new Uint8Array(n);
  const stack: number[] = [];
  const push = (p: number) => {
    if (seen[p] === 0 && isBg(p)) {
      seen[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  let cleared = 0;
  while (stack.length) {
    const p = stack.pop() as number;
    rgba[p * 4 + 3] = 0;
    cleared++;
    const x = p % width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (p >= width) push(p - width);
    if (p < n - width) push(p + width);
  }
  // Feather: opaque pixels touching the cleared area take alpha from how close to white they are.
  for (let p = 0; p < n; p++) {
    if (seen[p]) continue;
    const x = p % width;
    const touches =
      (x > 0 && seen[p - 1]) ||
      (x < width - 1 && seen[p + 1]) ||
      (p >= width && seen[p - width]) ||
      (p < n - width && seen[p + width]);
    if (!touches) continue;
    const o = p * 4;
    const minC = Math.min(rgba[o] ?? 0, rgba[o + 1] ?? 0, rgba[o + 2] ?? 0);
    const a = Math.round(255 * Math.min(1, Math.max(0, (threshold - minC) / 48 + 0.35)));
    rgba[o + 3] = Math.min(rgba[o + 3] ?? 255, a);
  }
  return cleared;
}
