import { applyPatches, enablePatches, type Patch, produceWithPatches } from "immer";
import type { Recipe } from "./commands";
import type { EditorDocument } from "./document";

enablePatches();

/** Undo depth (PRD US3.4: at least 100 steps). */
export const HISTORY_LIMIT = 100;
/** Edits with the same coalesce key closer together than this merge into one undo step (slider drags, typing). */
export const COALESCE_MS = 800;

export interface HistoryEntry {
  label: string;
  patches: Patch[];
  inverse: Patch[];
  key?: string;
  at: number;
}

export interface EditorHistory {
  doc: EditorDocument;
  past: readonly HistoryEntry[];
  future: readonly HistoryEntry[];
}

export interface ApplyOptions {
  label: string;
  /** Merge with the previous step if it has the same key and happened within COALESCE_MS. */
  key?: string;
  now?: number;
}

export function createHistory(doc: EditorDocument): EditorHistory {
  return { doc, past: [], future: [] };
}

/** Run a command as one undoable step. A recipe that changes nothing leaves history untouched. */
export function apply(state: EditorHistory, recipe: Recipe, opts: ApplyOptions): EditorHistory {
  const [doc, patches, inverse] = produceWithPatches(state.doc, recipe);
  if (patches.length === 0) return state;
  const now = opts.now ?? Date.now();
  const last = state.past.at(-1);
  if (opts.key && last?.key === opts.key && now - last.at < COALESCE_MS) {
    const merged: HistoryEntry = {
      ...last,
      patches: [...last.patches, ...patches],
      inverse: [...inverse, ...last.inverse],
      at: now,
    };
    return { doc, past: [...state.past.slice(0, -1), merged], future: [] };
  }
  const entry: HistoryEntry = { label: opts.label, patches, inverse, key: opts.key, at: now };
  return { doc, past: [...state.past, entry].slice(-HISTORY_LIMIT), future: [] };
}

export function undo(state: EditorHistory): EditorHistory {
  const entry = state.past.at(-1);
  if (!entry) return state;
  return {
    doc: applyPatches(state.doc, entry.inverse),
    past: state.past.slice(0, -1),
    future: [entry, ...state.future],
  };
}

export function redo(state: EditorHistory): EditorHistory {
  const [entry, ...rest] = state.future;
  if (!entry) return state;
  return { doc: applyPatches(state.doc, entry.patches), past: [...state.past, entry], future: rest };
}

/** Replace the document without an undo step (e.g. loading a recovered copy). Clears history. */
export function reset(doc: EditorDocument): EditorHistory {
  return createHistory(doc);
}
