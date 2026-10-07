import { findFilter } from "./adjust";
import type { EditorDocument } from "./document";

export const EXPORT_FORMATS = ["png", "jpg", "webp", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_MIME: Record<ExportFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

export interface ExportSize {
  width: number;
  height: number;
  /** Multiplier from design pixels to output pixels (Konva `pixelRatio`). */
  pixelRatio: number;
  /** True when the plan limit made the output smaller than requested. */
  capped: boolean;
}

/**
 * Output size for a page at `scale`× design size, with the longest edge capped at the plan's
 * `maxExportPx` (PRD US5.3). Aspect ratio is always kept.
 */
export function exportSize(page: { width: number; height: number }, scale: number, maxPx: number): ExportSize {
  const longest = Math.max(page.width, page.height);
  const wanted = longest * scale;
  const capped = wanted > maxPx;
  const pixelRatio = (capped ? maxPx : wanted) / longest;
  return {
    width: Math.max(1, Math.round(page.width * pixelRatio)),
    height: Math.max(1, Math.round(page.height * pixelRatio)),
    pixelRatio,
    capped,
  };
}

/** Bottom-right watermark box for an output of the given size (US5.2). */
export function watermarkLayout(width: number, height: number) {
  const fontSize = Math.max(11, Math.round(Math.min(width, height) * 0.032));
  const margin = Math.round(fontSize * 0.9);
  return { fontSize, margin, x: width - margin, y: height - margin };
}

/** Safe download name: "Summer sale!" + png → "summer-sale.png". */
export function exportFileName(name: string, format: ExportFormat): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${slug || "design"}.${format}`;
}

/** Premium filters used anywhere in the document (exports are gated on the Free plan, US4.3). */
export function premiumFiltersUsed(doc: EditorDocument): string[] {
  const ids = new Set<string>();
  for (const page of doc.pages) {
    for (const n of page.nodes) {
      if (n.type === "image" && n.filter && n.filter.intensity > 0 && findFilter(n.filter.presetId)?.premium) {
        ids.add(n.filter.presetId);
      }
    }
  }
  return [...ids];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Center crop (fractions of the source) for a target aspect ratio, zoomed in by `zoom` ≥ 1 and
 * panned by `panX`/`panY` in −1…1 (−1 = flush left/top, 1 = flush right/bottom).
 */
export function cropForRatio(
  source: { width: number; height: number },
  ratio: number | null,
  zoom = 1,
  panX = 0,
  panY = 0,
): { x: number; y: number; width: number; height: number } {
  const srcRatio = source.width / source.height;
  const target = ratio ?? srcRatio;
  let w = 1;
  let h = 1;
  if (target > srcRatio) h = srcRatio / target;
  else w = target / srcRatio;
  const z = Math.max(1, zoom);
  w /= z;
  h /= z;
  const clampPan = (p: number) => Math.min(Math.max(p, -1), 1);
  return {
    x: ((1 - w) / 2) * (1 + clampPan(panX)),
    y: ((1 - h) / 2) * (1 + clampPan(panY)),
    width: w,
    height: h,
  };
}
