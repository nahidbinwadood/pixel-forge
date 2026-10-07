"use client";

import { getNode } from "@pixelforge/editor-core";
import { useEffect } from "react";
import { textNode } from "./factories";
import { isTypingTarget } from "./shortcuts";
import { useEditorStore } from "./store";
import { useActions } from "./use-actions";

/** Global editor shortcuts (see shortcuts.ts for the documented list). */
export function useShortcuts(opts: { onExport: () => void; onHelp: () => void; defaultText: string }) {
  const store = useEditorStore();
  const a = useActions();
  const { onExport, onHelp, defaultText } = opts;

  useEffect(() => {
    const resolve = (e: KeyboardEvent): (() => void) | undefined => {
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      const s = store.get();
      if (mod) {
        if (k === "z") return e.shiftKey ? store.redo : store.undo;
        if (k === "y") return store.redo;
        if (k === "d") return a.duplicate;
        if (k === "a") return a.selectAll;
        if (k === "g") return e.shiftKey ? a.ungroup : a.group;
        if (k === "l" && e.shiftKey) return a.toggleLock;
        if (k === "e") return onExport;
        if (e.code === "BracketRight") return () => a.reorder(e.shiftKey ? "front" : "forward");
        if (e.code === "BracketLeft") return () => a.reorder(e.shiftKey ? "back" : "backward");
        if (k === "=" || k === "+") return () => store.canvas()?.zoomTo(s.zoom * 1.25);
        if (k === "-") return () => store.canvas()?.zoomTo(s.zoom / 1.25);
        if (k === "0") return () => store.canvas()?.fit();
        if (k === "'") return () => store.set({ showGrid: !s.showGrid });
        return undefined;
      }
      if (k === "delete" || k === "backspace") return a.remove;
      if (k === "escape") return () => store.select([]);
      if (k === "?") return onHelp;
      if (k === "\\") return () => store.set({ compare: !s.compare });
      if (k === "t") return () => a.add(textNode(store.page(), "body", defaultText));
      const only = s.selection.length === 1 ? s.selection[0] : undefined;
      if (k === "enter" && only && getNode(store.page(), only)?.type === "text") {
        return () => store.set({ editingTextId: only });
      }
      const step = e.shiftKey ? 10 : 1;
      const arrows: Record<string, [number, number]> = {
        arrowleft: [-step, 0],
        arrowright: [step, 0],
        arrowup: [0, -step],
        arrowdown: [0, step],
      };
      const d = arrows[k];
      return d && s.selection.length ? () => a.nudge(d[0], d[1]) : undefined;
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.defaultPrevented) return;
      // Radix dialogs/menus own the keyboard while open.
      if (document.querySelector("[role=dialog][data-state=open], [role=menu][data-state=open]")) return;
      const action = resolve(e);
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, a, onExport, onHelp, defaultText]);
}
