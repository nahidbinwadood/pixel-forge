import type { Box } from "./selectors";

export interface SnapResult {
  /** Adjusted top-left of the moving box. */
  x: number;
  y: number;
  /** Guide lines to draw, in page coordinates. */
  vertical: number[];
  horizontal: number[];
}

const stops = (start: number, size: number) => [start, start + size / 2, start + size];

/**
 * Snap a moving box's edges/center to other objects' edges/centers and to the page edges/center
 * (PRD US3.6). `threshold` is in page units; pass screen px / zoom so it feels constant on screen.
 */
export function snapBox(
  moving: Box,
  others: readonly Box[],
  page: { width: number; height: number },
  threshold: number,
): SnapResult {
  const targets = [{ x: 0, y: 0, width: page.width, height: page.height }, ...others];
  const xs = targets.flatMap((b) => stops(b.x, b.width));
  const ys = targets.flatMap((b) => stops(b.y, b.height));
  const sx = axis(stops(moving.x, moving.width), xs, threshold);
  const sy = axis(stops(moving.y, moving.height), ys, threshold);
  return {
    x: moving.x + sx.delta,
    y: moving.y + sy.delta,
    vertical: sx.lines,
    horizontal: sy.lines,
  };
}

function axis(own: number[], targets: number[], threshold: number) {
  let best: number | null = null;
  for (const o of own) {
    for (const t of targets) {
      const d = t - o;
      if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best))) best = d;
    }
  }
  if (best === null) return { delta: 0, lines: [] };
  const delta = best;
  const lines = [...new Set(own.map((o) => o + delta).filter((v) => targets.some((t) => Math.abs(t - v) < 0.5)))];
  return { delta, lines };
}
