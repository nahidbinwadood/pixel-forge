/**
 * Lightweight SVG renderer for template thumbnails (A3 brief: "simplest correct option is a
 * lightweight SVG renderer of the document used for thumbnails"). It understands the editor-core
 * node types used by seeded templates (text, shape, image-fill backgrounds) well enough for a
 * faithful small preview. It is NOT the real editor renderer — strokes/gradient angles are
 * good enough for a thumbnail, not pixel-perfect. The real canvas lives in the editor (A1).
 */
import type { EditorDocument, Node, Page } from "@pixelforge/editor-core";

type Fill =
  | { type: "solid"; color: string }
  | { type: "linear"; angle: number; stops: { offset: number; color: string }[] };

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c] as string);
}

/** CSS-style gradient angle (0deg = to top, clockwise) to an objectBoundingBox vector. */
function angleToVector(angleDeg: number) {
  const theta = (angleDeg * Math.PI) / 180;
  const x2 = 0.5 + 0.5 * Math.sin(theta);
  const y2 = 0.5 - 0.5 * Math.cos(theta);
  return { x1: 1 - x2, y1: 1 - y2, x2, y2 };
}

function gradientDef(id: string, fill: Extract<Fill, { type: "linear" }>): string {
  const { x1, y1, x2, y2 } = angleToVector(fill.angle);
  const stops = fill.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("");
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
}

function fillAttr(fill: Fill | undefined, defs: string[], idPrefix: string): string {
  if (!fill) return "none";
  if (fill.type === "solid") return fill.color;
  const id = `${idPrefix}-grad`;
  defs.push(gradientDef(id, fill));
  return `url(#${id})`;
}

function nodeTransform(node: Node): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const transforms: string[] = [];
  if (node.rotation) transforms.push(`rotate(${node.rotation} ${cx} ${cy})`);
  if (node.flipX || node.flipY) {
    transforms.push(
      `translate(${cx} ${cy}) scale(${node.flipX ? -1 : 1} ${node.flipY ? -1 : 1}) translate(${-cx} ${-cy})`,
    );
  }
  return transforms.length ? ` transform="${transforms.join(" ")}"` : "";
}

function renderNode(node: Node, index: number, defs: string[], assetUrls: Record<string, string>): string {
  if (node.hidden) return "";
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const transform = nodeTransform(node);
  const opacity = node.opacity < 1 ? ` opacity="${node.opacity}"` : "";
  const id = `n${index}`;

  switch (node.type) {
    case "text": {
      const anchor = node.align === "center" ? "middle" : node.align === "right" ? "end" : "start";
      const tx = node.align === "center" ? cx : node.align === "right" ? node.x + node.width : node.x;
      const fill = fillAttr(node.fill, defs, id);
      const stroke = node.stroke ? ` stroke="${node.stroke.color}" stroke-width="${node.stroke.width}"` : "";
      // Templates author explicit line breaks ("30%\nOFF"); SVG <text> doesn't wrap, so split into tspans.
      const lines = node.text.split("\n");
      const tspans = lines
        .map(
          (line, i) =>
            `<tspan x="${tx}" dy="${i === 0 ? 0 : node.fontSize * node.lineHeight}">${escapeXml(line)}</tspan>`,
        )
        .join("");
      return `<text${transform}${opacity} y="${node.y + node.fontSize}" text-anchor="${anchor}" font-family="${escapeXml(node.fontFamily)}" font-size="${node.fontSize}" font-weight="${node.fontWeight}" letter-spacing="${node.letterSpacing}" fill="${fill}"${stroke}>${tspans}</text>`;
    }
    case "shape": {
      const fill = fillAttr(node.fill, defs, id);
      const stroke = node.stroke ? ` stroke="${node.stroke.color}" stroke-width="${node.stroke.width}"` : "";
      if (node.shape === "ellipse") {
        return `<ellipse${transform}${opacity} cx="${cx}" cy="${cy}" rx="${node.width / 2}" ry="${node.height / 2}" fill="${fill}"${stroke}/>`;
      }
      if (node.shape === "line") {
        return `<line${transform}${opacity} x1="${node.x}" y1="${node.y}" x2="${node.x + node.width}" y2="${node.y + node.height}" stroke="${node.stroke?.color ?? fill}" stroke-width="${node.stroke?.width ?? 2}"/>`;
      }
      if (node.shape === "triangle") {
        const points = `${cx},${node.y} ${node.x + node.width},${node.y + node.height} ${node.x},${node.y + node.height}`;
        return `<polygon${transform}${opacity} points="${points}" fill="${fill}"${stroke}/>`;
      }
      if (node.shape === "star" || node.shape === "polygon") {
        const sides = node.shape === "star" ? 5 : 6;
        const rx = node.width / 2;
        const ry = node.height / 2;
        const count = node.shape === "star" ? sides * 2 : sides;
        const points: string[] = [];
        for (let i = 0; i < count; i++) {
          const r = node.shape === "star" && i % 2 === 1 ? 0.45 : 1;
          const a = (Math.PI * 2 * i) / count - Math.PI / 2;
          points.push(`${cx + Math.cos(a) * rx * r},${cy + Math.sin(a) * ry * r}`);
        }
        return `<polygon${transform}${opacity} points="${points.join(" ")}" fill="${fill}"${stroke}/>`;
      }
      // rect (default)
      return `<rect${transform}${opacity} x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${node.cornerRadius}" fill="${fill}"${stroke}/>`;
    }
    case "image": {
      const url = assetUrls[node.assetId];
      if (!url) return "";
      return `<image${transform}${opacity} x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" href="${escapeXml(url)}" preserveAspectRatio="xMidYMid slice"/>`;
    }
    default:
      // sticker / group: no intrinsic visual at this layer (stickers resolve to an Asset the editor
      // fetches at render time; groups are metadata-only in the flat node list).
      return "";
  }
}

/** Renders page 1 of a document as a standalone SVG string. `assetUrls` maps Asset.id -> a fetchable URL. */
export function renderTemplatePreviewSvg(doc: EditorDocument, assetUrls: Record<string, string> = {}): string {
  const page: Page | undefined = doc.pages[0];
  if (!page) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>`;

  const defs: string[] = [];
  let background: string;
  if (page.background.type === "image") {
    const url = assetUrls[page.background.assetId];
    background = url
      ? `<image x="0" y="0" width="${page.width}" height="${page.height}" href="${escapeXml(url)}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect width="100%" height="100%" fill="#E7E5F5"/>`;
  } else {
    background = `<rect width="100%" height="100%" fill="${fillAttr(page.background, defs, "bg")}"/>`;
  }

  const body = page.nodes.map((node, i) => renderNode(node, i, defs, assetUrls)).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.width} ${page.height}">${defs.length ? `<defs>${defs.join("")}</defs>` : ""}${background}${body}</svg>`;
}

/** Percent-encoded data URL — plain `<img src>`, no base64 overhead, no dangerouslySetInnerHTML. */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
