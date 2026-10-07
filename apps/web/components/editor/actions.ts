import {
  type AlignEdge,
  addedNodeIds,
  addNodes,
  align,
  distribute,
  duplicate,
  getNode,
  group,
  moveBy,
  type Node,
  type ReorderDirection,
  removeNodes,
  reorder,
  setFlag,
  ungroup,
  updateEach,
} from "@pixelforge/editor-core";
import { newId } from "./factories";
import type { EditorStore } from "./store";

/**
 * Selection-level editor actions shared by the toolbar, context menu, layers panel and shortcuts.
 * Each one is a single command → a single undo step.
 */
export function editorActions(store: EditorStore) {
  const sel = () => store.get().selection;
  const nodes = () => sel().flatMap((id) => getNode(store.page(), id) ?? []);

  return {
    add(node: Node) {
      store.run(addNodes([node]), `Add ${node.type}`);
      store.select([node.id]);
    },
    remove() {
      if (sel().length) store.run(removeNodes(sel()), "Delete");
    },
    duplicate() {
      if (!sel().length) return;
      const before = store.page();
      store.run(duplicate(sel(), newId), "Duplicate");
      store.select(addedNodeIds(before, store.page()));
    },
    group() {
      if (sel().length >= 2) store.run(group(sel(), newId()), "Group");
    },
    ungroup() {
      if (sel().length) store.run(ungroup(sel()), "Ungroup");
    },
    /** Lock if anything selected is unlocked, otherwise unlock. */
    toggleLock() {
      const ns = nodes();
      if (ns.length)
        store.run(
          setFlag(
            sel(),
            "locked",
            ns.some((n) => !n.locked),
          ),
          "Lock",
        );
    },
    hide() {
      if (sel().length) {
        store.run(setFlag(sel(), "hidden", true), "Hide");
        store.select([]);
      }
    },
    reorder(direction: ReorderDirection) {
      if (sel().length) store.run(reorder(sel(), direction), "Reorder");
    },
    align(edge: AlignEdge) {
      if (sel().length) store.run(align(sel(), edge), "Align");
    },
    distribute(axis: "horizontal" | "vertical") {
      if (sel().length >= 3) store.run(distribute(sel(), axis), "Distribute");
    },
    nudge(dx: number, dy: number) {
      const movable = nodes()
        .filter((n) => !n.locked)
        .map((n) => n.id);
      if (movable.length) store.run(moveBy(movable, dx, dy), "Nudge", "nudge");
    },
    flip(axis: "x" | "y") {
      const ns = nodes();
      if (!ns.length) return;
      const key = axis === "x" ? "flipX" : "flipY";
      store.run(updateEach(Object.fromEntries(ns.map((n) => [n.id, { [key]: !n[key] }]))), "Flip");
    },
    selectAll() {
      store.select(
        store
          .page()
          .nodes.filter((n) => n.type !== "group" && !n.hidden)
          .map((n) => n.id),
      );
    },
  };
}

export type EditorActions = ReturnType<typeof editorActions>;
