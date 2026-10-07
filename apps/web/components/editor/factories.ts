import { type Node, type Page, parseNode, type ShapeNode } from "@pixelforge/editor-core";

/**
 * New-object factories. Colors here are document *content* defaults (what a user's design starts with),
 * not UI styling, so they are plain hex values rather than theme tokens.
 */
const INK = "#10112a";
const ACCENT = "#5b3fe0";

export const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

const centered = (page: Page, width: number, height: number) => ({
  x: Math.round((page.width - width) / 2),
  y: Math.round((page.height - height) / 2),
  width,
  height,
});

export type TextPreset = "heading" | "subheading" | "body";

export function textNode(page: Page, preset: TextPreset, text: string): Node {
  const base = Math.min(page.width, page.height);
  const size = { heading: base * 0.09, subheading: base * 0.055, body: base * 0.035 }[preset];
  const fontSize = Math.max(12, Math.round(size));
  const width = Math.round(page.width * 0.7);
  return parseNode({
    id: newId(),
    type: "text",
    name: text,
    ...centered(page, width, fontSize * 1.2),
    text,
    fontFamily: preset === "body" ? "Geist" : "Bricolage Grotesque",
    fontSize,
    fontWeight: preset === "heading" ? 700 : preset === "subheading" ? 600 : 400,
    align: "center",
    fill: { type: "solid", color: INK },
  });
}

export function shapeNode(page: Page, shape: ShapeNode["shape"]): Node {
  const side = Math.round(Math.min(page.width, page.height) * 0.3);
  const isLine = shape === "line";
  return parseNode({
    id: newId(),
    type: "shape",
    name: shape[0]?.toUpperCase() + shape.slice(1),
    shape,
    ...centered(page, side, isLine ? Math.max(4, Math.round(side * 0.04)) : side),
    fill: isLine ? undefined : { type: "solid", color: ACCENT },
    stroke: isLine ? { color: INK, width: Math.max(2, Math.round(side * 0.03)) } : undefined,
  });
}

/** Image fitted inside 60% of the page, keeping its aspect ratio. */
export function imageNode(page: Page, assetId: string, srcWidth: number, srcHeight: number, name?: string): Node {
  const scale = Math.min((page.width * 0.6) / srcWidth, (page.height * 0.6) / srcHeight, 1);
  const w = Math.max(1, Math.round(srcWidth * scale));
  const h = Math.max(1, Math.round(srcHeight * scale));
  return parseNode({ id: newId(), type: "image", name: name?.slice(0, 120), assetId, ...centered(page, w, h) });
}
