import { describe, expect, it } from "vitest";
import {
  addNodes,
  align,
  distribute,
  duplicate,
  group,
  moveBy,
  moveToIndex,
  removeNodes,
  reorder,
  resizePage,
  setBackground,
  setFlag,
  ungroup,
  updateEach,
  updateNodes,
} from "./commands";
import { createDocument, type EditorDocument, type Node, parseNode } from "./document";
import { apply, createHistory } from "./history";
import { addedNodeIds, getPage } from "./selectors";

const rect = (id: string, x: number, y = 0, w = 10, h = 10): Node =>
  parseNode({ id, type: "shape", shape: "rect", x, y, width: w, height: h });

function docWith(...nodes: Node[]): EditorDocument {
  const doc = createDocument(100, 100);
  return { ...doc, pages: [{ ...getPage(doc), nodes }] };
}

const run = (doc: EditorDocument, ...recipes: Array<Parameters<typeof apply>[1]>) =>
  recipes.reduce((s, r) => apply(s, r, { label: "t" }), createHistory(doc)).doc;
const ids = (doc: EditorDocument) => getPage(doc).nodes.map((n) => n.id);
const node = (doc: EditorDocument, id: string) => getPage(doc).nodes.find((n) => n.id === id) as Node;

describe("add / update / remove", () => {
  it("adds nodes and updates fields with clamping", () => {
    let doc = run(docWith(), addNodes([rect("a", 0)]));
    expect(ids(doc)).toEqual(["a"]);
    doc = run(doc, updateNodes(["a", "missing"], { x: 5, width: -3, opacity: 4 }));
    expect(node(doc, "a")).toMatchObject({ x: 5, width: 1, opacity: 1 });
    doc = run(doc, updateEach({ a: { y: 7 } }));
    expect(node(doc, "a").y).toBe(7);
  });

  it("throws for an unknown page", () => {
    expect(() => run(docWith(), addNodes([], "nope"))).toThrow(/not found/);
    expect(() => run(docWith(), addNodes([], "page-1"))).not.toThrow();
  });

  it("removing a group removes its members; removing members dissolves the group", () => {
    const base = run(docWith(rect("a", 0), rect("b", 20), rect("c", 40)), group(["a", "b"], "g"));
    expect(ids(run(base, removeNodes(["g"])))).toEqual(["c"]);
    const left = run(base, removeNodes(["a"]));
    expect(ids(left)).toEqual(["b", "c"]);
    expect(node(left, "b").groupId).toBeUndefined();
  });

  it("moves by a delta, dragging whole groups", () => {
    const doc = run(docWith(rect("a", 0), rect("b", 20), rect("c", 40)), group(["a", "b"], "g"), moveBy(["a"], 5, 6));
    expect(node(doc, "b")).toMatchObject({ x: 25, y: 6 });
    expect(node(doc, "c").x).toBe(40);
    expect(node(doc, "g")).toMatchObject({ x: 5, y: 6, width: 30 });
  });

  it("sets flags on groups and their members", () => {
    const doc = run(docWith(rect("a", 0), rect("b", 20)), group(["a", "b"], "g"), setFlag(["g"], "hidden", true));
    expect(getPage(doc).nodes.every((n) => n.hidden)).toBe(true);
    expect(node(run(doc, setFlag(["a"], "locked", true)), "a").locked).toBe(true);
  });
});

describe("z-order", () => {
  const base = docWith(rect("a", 0), rect("b", 0), rect("c", 0), rect("d", 0));
  it("moves forward/backward one step and keeps relative order", () => {
    expect(ids(run(base, reorder(["a"], "forward")))).toEqual(["b", "a", "c", "d"]);
    expect(ids(run(base, reorder(["d"], "forward")))).toEqual(["a", "b", "c", "d"]);
    expect(ids(run(base, reorder(["c", "d"], "backward")))).toEqual(["a", "c", "d", "b"]);
    expect(ids(run(base, reorder(["missing"], "front")))).toEqual(["a", "b", "c", "d"]);
  });
  it("brings to front / sends to back", () => {
    expect(ids(run(base, reorder(["a", "c"], "front")))).toEqual(["b", "d", "a", "c"]);
    expect(ids(run(base, reorder(["d"], "back")))).toEqual(["d", "a", "b", "c"]);
  });
  it("moves to an exact index", () => {
    expect(ids(run(base, moveToIndex("a", 99)))).toEqual(["b", "c", "d", "a"]);
    expect(ids(run(base, moveToIndex("d", -1)))).toEqual(["d", "a", "b", "c"]);
    expect(ids(run(base, moveToIndex("zz", 0)))).toEqual(["a", "b", "c", "d"]);
  });
});

describe("group / ungroup / duplicate", () => {
  it("groups ≥2 nodes, flattening existing groups, and ungroups", () => {
    const one = run(docWith(rect("a", 0), rect("b", 20)), group(["a"], "g"));
    expect(ids(one)).toEqual(["a", "b"]);
    const g = run(
      docWith(rect("a", 0), rect("b", 20), rect("c", 40)),
      group(["a", "b"], "g1"),
      group(["a", "c"], "g2"),
    );
    expect(ids(g)).toEqual(["a", "b", "c", "g2"]);
    expect(
      getPage(g)
        .nodes.filter((n) => n.groupId === "g2")
        .map((n) => n.id),
    ).toEqual(["a", "b", "c"]);
    const flat = run(g, ungroup(["b"]));
    expect(ids(flat)).toEqual(["a", "b", "c"]);
    expect(ids(run(g, ungroup(["g2", "missing"])))).toEqual(["a", "b", "c"]);
  });

  it("duplicates nodes and their group with fresh ids", () => {
    let n = 0;
    const makeId = () => `n${++n}`;
    const base = run(docWith(rect("a", 0), rect("b", 20)), group(["a", "b"], "g"));
    const dup = run(base, duplicate(["a"], makeId));
    const added = addedNodeIds(getPage(base), getPage(dup));
    expect(added).toEqual(["n1", "n3"]);
    expect(node(dup, "n1")).toMatchObject({ x: 24, groupId: "n2" });
    expect(node(dup, "n2").type).toBe("group");
    const single = run(docWith(rect("x", 0)), duplicate(["x"], makeId, 0));
    expect(getPage(single).nodes.at(-1)?.x).toBe(0);
    expect(getPage(single).nodes.at(-1)?.groupId).toBeUndefined();
  });
});

describe("align / distribute", () => {
  it("aligns a single node to the page", () => {
    const doc = docWith(rect("a", 10, 10, 20, 20));
    expect(node(run(doc, align(["a"], "center")), "a").x).toBe(40);
    expect(node(run(doc, align(["a"], "right")), "a").x).toBe(80);
    expect(node(run(doc, align(["a"], "bottom")), "a").y).toBe(80);
    expect(node(run(doc, align(["a"], "middle")), "a").y).toBe(40);
    expect(run(doc, align([], "left"))).toEqual(doc);
  });
  it("aligns several to their shared bounds, groups as one unit", () => {
    const doc = docWith(rect("a", 0, 0), rect("b", 50, 30), rect("c", 20, 60));
    const left = run(doc, align(["a", "b", "c"], "right"));
    expect(getPage(left).nodes.map((n) => n.x)).toEqual([50, 50, 50]);
    const top = run(doc, align(["a", "b"], "top"));
    expect(node(top, "b").y).toBe(0);
    const grouped = run(doc, group(["a", "b"], "g"), align(["a", "c"], "left"));
    expect(node(grouped, "b").x).toBe(50);
  });
  it("distributes ≥3 objects with equal gaps", () => {
    const doc = docWith(rect("a", 0), rect("b", 15), rect("c", 90), rect("d", 0, 0, 10, 10));
    const h = run(doc, distribute(["a", "b", "c"], "horizontal"));
    expect(node(h, "b").x).toBe(45);
    expect(run(doc, distribute(["a", "b"], "vertical"))).toEqual(doc);
    const v = run(docWith(rect("a", 0, 0), rect("b", 0, 5), rect("c", 0, 90)), distribute(["a", "b", "c"], "vertical"));
    expect(node(v, "b").y).toBe(45);
  });
});

describe("page", () => {
  it("sets background and size", () => {
    const doc = run(docWith(), setBackground({ type: "solid", color: "#000000" }), resizePage(200.4, 50));
    expect(getPage(doc)).toMatchObject({ width: 200, height: 50, background: { color: "#000000" } });
  });
});
