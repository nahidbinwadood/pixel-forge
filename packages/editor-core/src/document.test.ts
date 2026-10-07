import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION, migrate } from "./index";

const doc = {
  schemaVersion: 1,
  pages: [
    {
      id: "p1",
      width: 1080,
      height: 1080,
      background: { type: "solid", color: "#ffffff" },
      nodes: [
        { id: "g1", type: "group", x: 0, y: 0, width: 10, height: 10 },
        {
          id: "t1",
          type: "text",
          groupId: "g1",
          x: 10,
          y: 10,
          width: 200,
          height: 40,
          text: "Hi",
          fontFamily: "Inter",
          fontSize: 32,
          fill: { type: "solid", color: "#111111" },
        },
        {
          id: "i1",
          type: "image",
          assetId: "a1",
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          adjustments: { brightness: 20 },
        },
      ],
    },
  ],
};

describe("editor document", () => {
  it("parses a valid v1 doc and fills defaults", () => {
    const out = migrate(structuredClone(doc));
    const text = out.pages[0]?.nodes[1];
    expect(text?.type === "text" && text.align).toBe("left");
    expect(text?.opacity).toBe(1);
  });
  it("rejects newer, missing, and malformed versions", () => {
    expect(() => migrate({ ...doc, schemaVersion: CURRENT_SCHEMA_VERSION + 1 })).toThrow(RangeError);
    expect(() => migrate({ pages: doc.pages })).toThrow(TypeError);
    expect(() => migrate(null)).toThrow(TypeError);
  });
  it("rejects out-of-range adjustments and bad colors", () => {
    const image = { id: "i1", type: "image", assetId: "a1", x: 0, y: 0, width: 1, height: 1 };
    const page = { ...doc.pages[0], nodes: [{ ...image, adjustments: { brightness: 500 } }] };
    expect(() => migrate({ ...doc, pages: [page] })).toThrow();
    expect(() =>
      migrate({ ...doc, pages: [{ ...page, nodes: [], background: { type: "solid", color: "red" } }] }),
    ).toThrow();
  });
});
