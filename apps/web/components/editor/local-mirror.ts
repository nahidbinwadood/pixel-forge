import type { EditorDocument } from "@pixelforge/editor-core";

/**
 * IndexedDB mirror of unsaved edits for crash/offline recovery (PRD US3.5). One record per design.
 * Every call fails soft: private mode or blocked storage just means no local copy.
 */
export interface MirrorRecord {
  projectId: string;
  /** Server revision the edits are based on. */
  baseRevision: number;
  document: EditorDocument;
  updatedAt: number;
}

const DB = "pixelforge-editor";
const STORE = "unsaved";

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "projectId" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    } finally {
      db.close();
    }
  });
}

export const readMirror = (projectId: string) =>
  tx<MirrorRecord | undefined>("readonly", (s) => s.get(projectId)).then((r) => r ?? null);
export const writeMirror = (record: MirrorRecord) => tx("readwrite", (s) => s.put(record));
export const clearMirror = (projectId: string) => tx("readwrite", (s) => s.delete(projectId));
