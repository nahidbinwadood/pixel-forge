import { describe, expect, it } from "vitest";
import { createDocument, parseNode } from "./document";
import { findPreset, ratioLabel, SIZE_PRESETS } from "./presets";
import {
  drawableNodes,
  expandSelection,
  getNode,
  getPage,
  layersTopFirst,
  nodeBounds,
  unionBounds,
  usedAssetIds,
} from "./selectors";
import { snapBox } from "./snap";

const r = (id: string, extra: Record<string, unknown> = {}) =>
  parseNode({ id, type: "shape", shape: "rect", x: 0, y: 0, width: 10, height: 10, ...extra });

describe("selectors", () => {
  const doc = createDocument(100, 100);
  const page = {
    ...getPage(doc),
    background: { type: "image" as const, assetId: "bg" },
    nodes: [
      r("a", { groupId: "g" }),
      r("b", { groupId: "g" }),
      parseNode({ id: "g", type: "group", x: 0, y: 0, width: 10, height: 10, hidden: true }),
      r("c"),
      parseNode({ id: "i", type: "image", assetId: "img", x: 0, y: 0, width: 5, height: 5 }),
      r("h", { hidden: true }),
    ],
  };
  const d = { ...doc, pages: [page] };

  it("finds pages and nodes", () => {
    expect(getPage(d, "page-1")).toBe(page);
    expect(() => getPage(d, "x")).toThrow();
    expect(getNode(page, "c")?.id).toBe("c");
  });
  it("expands selection to whole groups", () => {
    expect(expandSelection(page, ["a"])).toEqual(["a", "b"]);
    expect(expandSelection(page, ["g", "c", "zz"])).toEqual(["a", "b", "c"]);
  });
  it("lists layers, drawables and assets", () => {
    expect(layersTopFirst(page)[0]?.id).toBe("h");
    expect(drawableNodes(page).map((n) => n.id)).toEqual(["c", "i"]);
    expect(usedAssetIds(d).sort()).toEqual(["bg", "img"]);
  });
  it("computes rotated bounds and unions", () => {
    const b = nodeBounds({ x: 0, y: 0, width: 10, height: 20, rotation: 90 });
    expect(b.x).toBeCloseTo(-20);
    expect(b.width).toBeCloseTo(20);
    expect(b.height).toBeCloseTo(10);
    expect(unionBounds([])).toBeNull();
    expect(unionBounds([b, { x: 0, y: 0, width: 5, height: 30 }])).toMatchObject({ y: 0, height: 30 });
  });
});

describe("snap", () => {
  const page = { width: 100, height: 100 };
  it("snaps to page center and other objects within threshold", () => {
    const s = snapBox({ x: 43, y: 2, width: 10, height: 10 }, [], page, 4);
    expect(s).toMatchObject({ x: 45, y: 0, vertical: [50], horizontal: [0] });
    const o = snapBox({ x: 61, y: 30, width: 10, height: 10 }, [{ x: 72, y: 80, width: 5, height: 5 }], page, 2);
    expect(o.x).toBe(62);
    expect(o.vertical).toContain(72);
  });
  it("leaves the box alone when nothing is close", () => {
    expect(snapBox({ x: 20, y: 20, width: 7, height: 7 }, [], page, 1)).toEqual({
      x: 20,
      y: 20,
      vertical: [],
      horizontal: [],
    });
  });
});

describe("presets", () => {
  it("has the brief's sizes and ratio labels", () => {
    expect(findPreset("instagram-post")).toMatchObject({ width: 1080, height: 1080 });
    expect(findPreset("nope")).toBeUndefined();
    expect(SIZE_PRESETS.map((p) => p.id)).toEqual(expect.arrayContaining(["a4", "poster", "youtube-thumbnail"]));
    expect(ratioLabel(1080, 1350)).toBe("4:5");
    expect(ratioLabel(1200, 627)).toBe("1.91:1");
  });
});
