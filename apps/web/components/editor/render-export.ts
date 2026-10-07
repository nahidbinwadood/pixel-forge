import { EXPORT_MIME, type ExportFormat, exportSize, watermarkLayout } from "@pixelforge/editor-core";
import { APP_NAME, type Plan } from "@pixelforge/shared";
import type { EditorStore } from "./store";

export interface ExportOptions {
  format: ExportFormat;
  /** Requested multiple of the design size (capped by the plan). */
  scale: number;
  /** 0–1, JPG/WebP only. */
  quality: number;
}

/** Free-tier watermark, bottom-right (US5.2). Drawn onto the rendered canvas, so it is part of the pixels. */
function drawWatermark(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { fontSize, x, y } = watermarkLayout(canvas.width, canvas.height);
  ctx.save();
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.lineWidth = Math.max(1, fontSize / 8);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const label = `Made with ${APP_NAME}`;
  ctx.strokeText(label, x, y);
  ctx.fillText(label, x, y);
  ctx.restore();
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, quality),
  );

/**
 * Client-side export (ASSUMPTIONS D13): render page 1 at the plan-capped size, watermark if required,
 * encode. PDF wraps a lossless PNG in a page sized at 96 dpi (1 px = 0.75 pt).
 */
export async function renderExport(store: EditorStore, plan: Plan, opts: ExportOptions): Promise<Blob> {
  const api = store.canvas();
  if (!api) throw new Error("canvas not ready");
  const page = store.page();
  const size = exportSize(page, opts.scale, plan.maxExportPx);
  const canvas = api.render(size.pixelRatio);
  if (plan.watermark) drawWatermark(canvas);

  if (opts.format !== "pdf") {
    const lossy = opts.format === "jpg" || opts.format === "webp";
    return toBlob(canvas, EXPORT_MIME[opts.format], lossy ? opts.quality : undefined);
  }
  const png = await toBlob(canvas, "image/png");
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(await png.arrayBuffer());
  const w = page.width * 0.75;
  const h = page.height * 0.75;
  pdf.addPage([w, h]).drawImage(image, { x: 0, y: 0, width: w, height: h });
  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: EXPORT_MIME.pdf });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
