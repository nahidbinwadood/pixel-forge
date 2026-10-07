import { describe, expect, it } from "vitest";
import { addNodes, updateNodes } from "./commands";
import { createDocument, parseNode } from "./document";
import { apply, COALESCE_MS, createHistory, HISTORY_LIMIT, redo, reset, undo } from "./history";
import { getPage } from "./selectors";

const text = parseNode({
  id: "t",
  type: "text",
  x: 0,
  y: 0,
  width: 100,
  height: 40,
  text: "Hi",
  fontFamily: "Geist",
  fontSize: 32,
  fill: { type: "solid", color: "#111111" },
});
const color = (h: ReturnType<typeof createHistory>) => {
  const n = getPage(h.doc).nodes[0];
  return n?.type === "text" && n.fill.type === "solid" ? n.fill.color : null;
};

describe("history", () => {
  it("undoes and redoes, and a new edit clears redo", () => {
    let h = apply(createHistory(createDocument(10, 10)), addNodes([text]), { label: "add" });
    h = apply(h, updateNodes(["t"], { fill: { type: "solid", color: "#ff0000" } }), { label: "color" });
    expect(color(h)).toBe("#ff0000");
    h = undo(h);
    expect(color(h)).toBe("#111111");
    expect(h.future).toHaveLength(1);
    h = redo(h);
    expect(color(h)).toBe("#ff0000");
    h = undo(undo(h));
    expect(getPage(h.doc).nodes).toHaveLength(0);
    expect(undo(h)).toBe(h);
    h = apply(redo(h), updateNodes(["t"], { x: 1 }), { label: "move" });
    expect(h.future).toHaveLength(0);
    expect(redo(h)).toBe(h);
  });

  it("ignores no-op commands", () => {
    const h = createHistory(createDocument(10, 10));
    expect(apply(h, updateNodes(["missing"], { x: 1 }), { label: "noop" })).toBe(h);
  });

  it("coalesces rapid edits with the same key into one step", () => {
    let h = apply(createHistory(createDocument(10, 10)), addNodes([text]), { label: "add", now: 0 });
    h = apply(h, updateNodes(["t"], { x: 1 }), { label: "x", key: "drag", now: 1000 });
    h = apply(h, updateNodes(["t"], { x: 2 }), { label: "x", key: "drag", now: 1000 + COALESCE_MS - 1 });
    expect(h.past).toHaveLength(2);
    h = apply(h, updateNodes(["t"], { x: 3 }), { label: "x", key: "drag", now: 10_000 });
    expect(h.past).toHaveLength(3);
    h = undo(undo(h));
    expect(getPage(h.doc).nodes[0]?.x).toBe(0);
  });

  it(`caps history at ${HISTORY_LIMIT} steps`, () => {
    let h = apply(createHistory(createDocument(10, 10)), addNodes([text]), { label: "add" });
    for (let i = 1; i <= HISTORY_LIMIT + 20; i++) h = apply(h, updateNodes(["t"], { x: i }), { label: "x" });
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(reset(h.doc).past).toHaveLength(0);
  });
});
