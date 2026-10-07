import type { EditorDocument, Node, Page } from "./document";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Page by id, or the first page. Throws if the id doesn't exist (callers pass ids they got from the doc). */
export function getPage(doc: EditorDocument, pageId?: string): Page {
  const page = pageId ? doc.pages.find((p) => p.id === pageId) : doc.pages[0];
  if (!page) throw new Error(`page ${pageId ?? "(first)"} not found`);
  return page;
}

export function getNode(page: Page, id: string): Node | undefined {
  return page.nodes.find((n) => n.id === id);
}

export function groupMembers(page: Page, groupId: string): Node[] {
  return page.nodes.filter((n) => n.groupId === groupId);
}

/**
 * Ids the user means when they select `ids`: a group expands to its members, and a grouped node
 * pulls in its whole group (groups move as one). Group nodes themselves are excluded; order follows z-order.
 */
export function expandSelection(page: Page, ids: readonly string[]): string[] {
  const wanted = new Set<string>();
  for (const id of ids) {
    const node = getNode(page, id);
    if (!node) continue;
    const groupId = node.type === "group" ? node.id : node.groupId;
    if (groupId) for (const m of groupMembers(page, groupId)) wanted.add(m.id);
    else wanted.add(node.id);
  }
  return page.nodes.filter((n) => wanted.has(n.id)).map((n) => n.id);
}

/** Axis-aligned bounds of a node after rotation about its (x, y) origin, as Konva rotates. */
export function nodeBounds(node: Pick<Node, "x" | "y" | "width" | "height" | "rotation">): Box {
  const rad = (node.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners: Array<[number, number]> = [
    [0, 0],
    [node.width, 0],
    [node.width, node.height],
    [0, node.height],
  ];
  const xs = corners.map(([cx, cy]) => node.x + cx * cos - cy * sin);
  const ys = corners.map(([cx, cy]) => node.y + cx * sin + cy * cos);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Union of boxes, or null for an empty list. */
export function unionBounds(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null;
  let x1 = Number.POSITIVE_INFINITY;
  let y1 = Number.POSITIVE_INFINITY;
  let x2 = Number.NEGATIVE_INFINITY;
  let y2 = Number.NEGATIVE_INFINITY;
  for (const b of boxes) {
    x1 = Math.min(x1, b.x);
    y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.width);
    y2 = Math.max(y2, b.y + b.height);
  }
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

/** Layers panel order: top of the stack first. */
export function layersTopFirst(page: Page): Node[] {
  return [...page.nodes].reverse();
}

/** Renderable nodes bottom-first (groups are bookkeeping only and draw nothing). */
export function drawableNodes(page: Page): Node[] {
  const hiddenGroups = new Set(page.nodes.filter((n) => n.type === "group" && n.hidden).map((n) => n.id));
  return page.nodes.filter((n) => n.type !== "group" && !n.hidden && !(n.groupId && hiddenGroups.has(n.groupId)));
}

/** Every asset the document references (images + image backgrounds), for URL resolution. */
export function usedAssetIds(doc: EditorDocument): string[] {
  const ids = new Set<string>();
  for (const page of doc.pages) {
    if (page.background.type === "image") ids.add(page.background.assetId);
    for (const n of page.nodes) if (n.type === "image") ids.add(n.assetId);
  }
  return [...ids];
}

/** Ids present in `next` but not in `prev` (e.g. to select what a duplicate/paste just created). */
export function addedNodeIds(prev: Page, next: Page): string[] {
  const before = new Set(prev.nodes.map((n) => n.id));
  return next.nodes.filter((n) => !before.has(n.id) && n.type !== "group").map((n) => n.id);
}
