import type { Recipe, TextNode } from "@pixelforge/editor-core";
import Konva from "konva";
import { cssFontFamily } from "./fonts";

const heights = new Map<string, number>();
let probe: Konva.Text | null = null;

/** Rendered height of a text box (wrapping at its width), cached by the props that affect layout. */
export function measureTextHeight(n: TextNode): number {
  const key = [n.text, n.fontFamily, n.fontSize, n.fontWeight, n.width, n.lineHeight, n.letterSpacing].join("|");
  const hit = heights.get(key);
  if (hit !== undefined) return hit;
  probe ??= new Konva.Text({});
  probe.setAttrs({
    text: n.text || " ",
    fontFamily: cssFontFamily(n.fontFamily),
    fontSize: n.fontSize,
    fontStyle: String(n.fontWeight),
    width: n.width,
    lineHeight: n.lineHeight,
    letterSpacing: n.letterSpacing,
    wrap: "word",
  });
  const h = Math.max(1, Math.ceil(probe.height()));
  if (heights.size > 2000) heights.clear();
  heights.set(key, h);
  return h;
}

/** Fonts finished loading: cached measurements may be stale. */
export function resetTextMeasurements() {
  heights.clear();
}

/** Keep text node heights equal to their rendered height so bounds, snapping and align stay exact. */
export function fitTextHeights(recipe: Recipe): Recipe {
  return (doc) => {
    recipe(doc);
    for (const page of doc.pages) {
      for (const n of page.nodes) {
        if (n.type !== "text") continue;
        const h = measureTextHeight(n as TextNode);
        if (Math.abs(n.height - h) > 0.5) n.height = h;
      }
    }
  };
}
