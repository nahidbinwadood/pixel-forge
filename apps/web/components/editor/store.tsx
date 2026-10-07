"use client";

import {
  apply,
  type EditorDocument,
  type EditorHistory,
  expandSelection,
  getPage,
  type Page,
  type Recipe,
  redo,
  reset,
  undo,
} from "@pixelforge/editor-core";
import type { Plan } from "@pixelforge/shared";
import { createContext, type ReactNode, useContext, useRef, useSyncExternalStore } from "react";
import { fitTextHeights } from "./text-measure";

export type SaveStatus = "saved" | "saving" | "pending" | "offline" | "error";
export type Panel = "uploads" | "text" | "shapes" | "elements" | "layers" | null;

export interface EditorState {
  projectId: string;
  name: string;
  history: EditorHistory;
  /** Server revision the current document is based on. */
  revision: number;
  selection: string[];
  zoom: number;
  /** Stage position of the page's top-left corner, in screen px. */
  view: { x: number; y: number };
  /** True while dragging/transforming (hides the floating toolbar). */
  interacting: boolean;
  panel: Panel;
  showGrid: boolean;
  snapping: boolean;
  /** Hold-to-compare: render images without adjustments/filters (PRD US4.4). */
  compare: boolean;
  saveStatus: SaveStatus;
  assetUrls: Record<string, string>;
  /** Id of a text node being edited in place. */
  editingTextId: string | null;
  /** The user's plan (export limits, watermark, premium filters). */
  plan: Plan;
}

type Listener = () => void;

/** Imperative canvas API registered by the stage (fit view, render the page for export/thumbnails). */
export interface CanvasApi {
  fit: () => void;
  zoomTo: (zoom: number) => void;
  /** Page 1 rendered at `pixelRatio`× design size, without selection UI or grid. */
  render: (pixelRatio: number) => HTMLCanvasElement;
}

/**
 * Tiny external store (useSyncExternalStore) so canvas, panels and toolbars subscribe to just the slice
 * they render. The document only changes through `run()` (editor-core commands → Immer history).
 */
export function createEditorStore(initial: EditorState) {
  let state = initial;
  const listeners = new Set<Listener>();
  let canvas: CanvasApi | null = null;
  const set = (patch: Partial<EditorState>) => {
    state = { ...state, ...patch };
    for (const l of listeners) l();
  };
  const page = (): Page => getPage(state.history.doc);
  const keepSelection = (history: EditorHistory) => {
    const ids = new Set(getPage(history.doc).nodes.map((n) => n.id));
    return state.selection.filter((id) => ids.has(id));
  };

  return {
    get: () => state,
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    set,
    page,
    registerCanvas(api: CanvasApi | null) {
      canvas = api;
    },
    canvas: () => canvas,
    /** Apply a command as one undoable step. `key` coalesces rapid edits (slider drags, typing). */
    run(recipe: Recipe, label: string, key?: string) {
      const history = apply(state.history, fitTextHeights(recipe), { label, key });
      if (history !== state.history) set({ history, selection: keepSelection(history) });
    },
    undo() {
      const history = undo(state.history);
      set({ history, selection: keepSelection(history), editingTextId: null });
    },
    redo() {
      const history = redo(state.history);
      set({ history, selection: keepSelection(history), editingTextId: null });
    },
    /** Replace the document without an undo step (crash recovery). */
    replaceDocument(doc: EditorDocument) {
      set({ history: reset(doc), selection: [] });
    },
    select(ids: readonly string[], additive = false) {
      const expanded = expandSelection(page(), ids);
      const next = additive
        ? expanded.every((id) => state.selection.includes(id))
          ? state.selection.filter((id) => !expanded.includes(id))
          : [...new Set([...state.selection, ...expanded])]
        : expanded;
      set({ selection: next, editingTextId: null });
    },
  };
}

export type EditorStore = ReturnType<typeof createEditorStore>;

const StoreContext = createContext<EditorStore | null>(null);

export function EditorStoreProvider({ initial, children }: { initial: EditorState; children: ReactNode }) {
  const ref = useRef<EditorStore | null>(null);
  ref.current ??= createEditorStore(initial);
  return <StoreContext.Provider value={ref.current}>{children}</StoreContext.Provider>;
}

export function useEditorStore(): EditorStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useEditorStore must be used inside EditorStoreProvider");
  return store;
}

/** Subscribe to a slice. Selectors must return stable references (state fields, not new objects). */
export function useEditor<T>(selector: (s: EditorState) => T): T {
  const store = useEditorStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}

export const usePage = () => useEditor((s) => getPage(s.history.doc));
