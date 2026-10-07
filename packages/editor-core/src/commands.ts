import { current, type Draft } from "immer";
import type { Background, EditorDocument, ImageNode, Node, Page, ShapeNode, StickerNode, TextNode } from "./document";
import { type Box, expandSelection, nodeBounds, unionBounds } from "./selectors";

/**
 * Editor commands (CLAUDE.md: the document changes only through these). Each returns an Immer recipe;
 * run it through `apply()` in history.ts so it becomes one undoable step.
 */
export type Recipe = (draft: Draft<EditorDocument>) => void;
type DraftPage = Draft<Page>;
type DraftNode = Draft<Node>;

type Fields<T> = Omit<T, "type" | "id">;
/** Any field of any node type. Callers only send the fields that make sense for the selection. */
export type NodePatch = Partial<Fields<ImageNode> & Fields<TextNode> & Fields<ShapeNode> & Fields<StickerNode>>;

export type ReorderDirection = "forward" | "backward" | "front" | "back";
export type AlignEdge = "left" | "center" | "right" | "top" | "middle" | "bottom";

function pageOf(doc: Draft<EditorDocument>, pageId?: string): DraftPage {
  const page = pageId ? doc.pages.find((p) => p.id === pageId) : doc.pages[0];
  if (!page) throw new Error(`page ${pageId ?? "(first)"} not found`);
  return page;
}

function byId(page: DraftPage): Map<string, DraftNode> {
  return new Map(page.nodes.map((n) => [n.id, n]));
}

/** Translate nodes and keep group boxes in step. */
function translate(page: DraftPage, ids: readonly string[], dx: number, dy: number) {
  const nodes = byId(page);
  for (const id of ids) {
    const n = nodes.get(id);
    if (!n) continue;
    n.x += dx;
    n.y += dy;
  }
  syncGroupBoxes(page);
}

/** Group nodes carry the bounds of their members (used for the layers panel and selection). */
function syncGroupBoxes(page: DraftPage) {
  for (const g of page.nodes) {
    if (g.type !== "group") continue;
    const box = unionBounds(page.nodes.filter((n) => n.groupId === g.id).map(nodeBounds));
    if (!box) continue;
    g.x = box.x;
    g.y = box.y;
    g.width = Math.max(box.width, 1);
    g.height = Math.max(box.height, 1);
  }
}

/** Drop empty groups and dissolve single-member ones. */
function pruneGroups(page: DraftPage) {
  for (const g of page.nodes.filter((n) => n.type === "group")) {
    const members = page.nodes.filter((n) => n.groupId === g.id);
    if (members.length >= 2) continue;
    for (const m of members) m.groupId = undefined;
    page.nodes.splice(page.nodes.indexOf(g), 1);
  }
}

export function addNodes(nodes: readonly Node[], pageId?: string): Recipe {
  return (doc) => {
    pageOf(doc, pageId).nodes.push(...structuredClone(nodes as Node[]));
  };
}

export function updateNodes(ids: readonly string[], patch: NodePatch, pageId?: string): Recipe {
  return (doc) => {
    const nodes = byId(pageOf(doc, pageId));
    for (const id of ids) {
      const n = nodes.get(id);
      if (!n) continue;
      Object.assign(n, structuredClone(patch));
      n.width = Math.max(n.width, 1);
      n.height = Math.max(n.height, 1);
      n.opacity = Math.min(Math.max(n.opacity, 0), 1);
    }
    syncGroupBoxes(pageOf(doc, pageId));
  };
}

/** Per-node patches in one step (e.g. a multi-object transform). */
export function updateEach(patches: Readonly<Record<string, NodePatch>>, pageId?: string): Recipe {
  return (doc) => {
    for (const [id, patch] of Object.entries(patches)) updateNodes([id], patch, pageId)(doc);
  };
}

/** Hidden/locked apply to a group's members too, so the group behaves as one layer. */
export function setFlag(ids: readonly string[], flag: "hidden" | "locked", value: boolean, pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const targets = new Set(ids);
    for (const n of page.nodes)
      if (n.type === "group" && targets.has(n.id))
        for (const m of page.nodes) if (m.groupId === n.id) targets.add(m.id);
    for (const n of page.nodes) if (targets.has(n.id)) n[flag] = value;
  };
}

export function moveBy(ids: readonly string[], dx: number, dy: number, pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    translate(page, expandSelection(page as Page, ids), dx, dy);
  };
}

export function removeNodes(ids: readonly string[], pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const gone = new Set(ids);
    for (const n of page.nodes) if (n.groupId && gone.has(n.groupId)) gone.add(n.id);
    page.nodes = page.nodes.filter((n) => !gone.has(n.id));
    pruneGroups(page);
    syncGroupBoxes(page);
  };
}

/** Move the given nodes one step or all the way up/down the stack, keeping their relative order. */
export function reorder(ids: readonly string[], direction: ReorderDirection, pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const moving = new Set(expandSelection(page as Page, ids));
    if (moving.size === 0) return;
    const nodes = page.nodes;
    if (direction === "front" || direction === "back") {
      const picked = nodes.filter((n) => moving.has(n.id));
      const rest = nodes.filter((n) => !moving.has(n.id));
      page.nodes = direction === "front" ? [...rest, ...picked] : [...picked, ...rest];
      return;
    }
    const order = direction === "forward" ? [...nodes.keys()].reverse() : [...nodes.keys()];
    const step = direction === "forward" ? 1 : -1;
    for (const i of order) {
      const node = nodes[i];
      const j = i + step;
      const other = nodes[j];
      if (!node || !other || !moving.has(node.id) || moving.has(other.id)) continue;
      nodes[i] = other;
      nodes[j] = node;
    }
  };
}

/** Put one node at an exact stack index (layers panel drag). */
export function moveToIndex(id: string, index: number, pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const from = page.nodes.findIndex((n) => n.id === id);
    if (from < 0) return;
    const [node] = page.nodes.splice(from, 1);
    if (!node) return;
    page.nodes.splice(Math.min(Math.max(index, 0), page.nodes.length), 0, node);
  };
}

/** Group ≥ 2 nodes under a new group node (nested groups flatten into one). */
export function group(ids: readonly string[], groupId: string, pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const memberIds = expandSelection(page as Page, ids);
    if (memberIds.length < 2) return;
    const members = new Set(memberIds);
    const oldGroups = new Set(page.nodes.filter((n) => members.has(n.id) && n.groupId).map((n) => n.groupId));
    page.nodes = page.nodes.filter((n) => !(n.type === "group" && oldGroups.has(n.id)));
    let top = -1;
    page.nodes.forEach((n, i) => {
      if (!members.has(n.id)) return;
      n.groupId = groupId;
      top = i;
    });
    page.nodes.splice(top + 1, 0, {
      id: groupId,
      type: "group",
      name: "Group",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      blendMode: "normal",
      locked: false,
      hidden: false,
    });
    syncGroupBoxes(page);
  };
}

export function ungroup(groupIds: readonly string[], pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const groups = new Set(
      groupIds.flatMap((id) => {
        const n = page.nodes.find((x) => x.id === id);
        return n?.type === "group" ? [n.id] : n?.groupId ? [n.groupId] : [];
      }),
    );
    for (const n of page.nodes) if (n.groupId && groups.has(n.groupId)) n.groupId = undefined;
    page.nodes = page.nodes.filter((n) => !groups.has(n.id));
  };
}

/** Copy nodes (with their groups) on top of the stack, offset so the copy is visible. */
export function duplicate(ids: readonly string[], makeId: () => string, offset = 24, pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const sources = new Set(expandSelection(page as Page, ids));
    const groupMap = new Map<string, string>();
    const copies: Node[] = [];
    for (const n of page.nodes) {
      if (!sources.has(n.id)) continue;
      const copy = structuredClone(current(n));
      copy.id = makeId();
      copy.x += offset;
      copy.y += offset;
      if (n.groupId) {
        const g = groupMap.get(n.groupId) ?? makeId();
        groupMap.set(n.groupId, g);
        copy.groupId = g;
      }
      copies.push(copy);
    }
    for (const [oldId, newId] of groupMap) {
      const g = page.nodes.find((n) => n.id === oldId);
      if (g) copies.push({ ...structuredClone(current(g) as Node), id: newId });
    }
    page.nodes.push(...copies);
    syncGroupBoxes(page);
  };
}

/** Align to the selection's bounds, or to the page when one object (or one group) is selected. */
export function align(ids: readonly string[], edge: AlignEdge, pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const expanded = expandSelection(page as Page, ids);
    const units = alignmentUnits(page as Page, expanded);
    if (units.length === 0) return;
    const target: Box =
      units.length === 1
        ? { x: 0, y: 0, width: page.width, height: page.height }
        : (unionBounds(units.map((u) => u.box)) as Box);
    for (const u of units) {
      const dx =
        edge === "left"
          ? target.x - u.box.x
          : edge === "right"
            ? target.x + target.width - (u.box.x + u.box.width)
            : edge === "center"
              ? target.x + target.width / 2 - (u.box.x + u.box.width / 2)
              : 0;
      const dy =
        edge === "top"
          ? target.y - u.box.y
          : edge === "bottom"
            ? target.y + target.height - (u.box.y + u.box.height)
            : edge === "middle"
              ? target.y + target.height / 2 - (u.box.y + u.box.height / 2)
              : 0;
      translate(page, u.ids, dx, dy);
    }
  };
}

/** Equal gaps between ≥ 3 objects along an axis; the outermost two stay put. */
export function distribute(ids: readonly string[], axis: "horizontal" | "vertical", pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    const units = alignmentUnits(page as Page, expandSelection(page as Page, ids));
    if (units.length < 3) return;
    const pos = (b: Box) => (axis === "horizontal" ? b.x : b.y);
    const size = (b: Box) => (axis === "horizontal" ? b.width : b.height);
    units.sort((a, b) => pos(a.box) - pos(b.box));
    const first = units[0] as (typeof units)[number];
    const last = units[units.length - 1] as (typeof units)[number];
    const span = pos(last.box) + size(last.box) - pos(first.box);
    const gap = (span - units.reduce((s, u) => s + size(u.box), 0)) / (units.length - 1);
    let cursor = pos(first.box);
    for (const u of units) {
      const d = cursor - pos(u.box);
      translate(page, u.ids, axis === "horizontal" ? d : 0, axis === "vertical" ? d : 0);
      cursor += size(u.box) + gap;
    }
  };
}

/** Groups align as one unit; ungrouped nodes align individually. */
function alignmentUnits(page: Page, ids: readonly string[]): Array<{ ids: string[]; box: Box }> {
  const units = new Map<string, Node[]>();
  for (const n of page.nodes) {
    if (!ids.includes(n.id)) continue;
    const key = n.groupId ?? n.id;
    units.set(key, [...(units.get(key) ?? []), n]);
  }
  return [...units.values()].map((nodes) => ({
    ids: nodes.map((n) => n.id),
    box: unionBounds(nodes.map(nodeBounds)) as Box,
  }));
}

export function setBackground(background: Background, pageId?: string): Recipe {
  return (doc) => {
    pageOf(doc, pageId).background = structuredClone(background);
  };
}

export function resizePage(width: number, height: number, pageId?: string): Recipe {
  return (doc) => {
    const page = pageOf(doc, pageId);
    page.width = Math.round(width);
    page.height = Math.round(height);
  };
}
