"use client";

import { type EditorDocument, getPage, migrate } from "@pixelforge/editor-core";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { clearMirror, readMirror, writeMirror } from "./local-mirror";
import { type EditorStore, useEditorStore } from "./store";

const SAVE_DELAY = 2000;
const MIRROR_DELAY = 250;
const THUMB_EVERY = 15_000;
const THUMB_EDGE = 480;
const MAX_RETRY = 60_000;

/** Render page 1 small and upload it as the My Designs thumbnail. Best effort. */
async function uploadThumbnail(store: EditorStore) {
  const api = store.canvas();
  if (!api) return;
  const page = store.page();
  const canvas = api.render(THUMB_EDGE / Math.max(page.width, page.height));
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.8));
  if (!blob) return;
  await fetch(`/api/v1/projects/${store.get().projectId}/thumbnail`, {
    method: "PUT",
    headers: { "Content-Type": blob.type || "image/png" },
    body: blob,
  });
}

/**
 * Autosave (PRD US3.5): 2 s after the last edit, PATCH {document, revision}. Unsaved state is mirrored
 * to IndexedDB, offline edits wait for `online`, and a revision conflict (409) never drops work: the
 * local version is saved as a copy and opened.
 */
export function useAutosave() {
  const store = useEditorStore();
  const router = useRouter();
  const t = useTranslations("editor");

  useEffect(() => {
    const { projectId } = store.get();
    let lastSaved: EditorDocument = store.get().history.doc;
    let lastSeen = lastSaved;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let mirrorTimer: ReturnType<typeof setTimeout> | undefined;
    let inflight = false;
    let retryDelay = 2000;
    let lastThumb = 0;
    let disposed = false;

    const dirty = () => store.get().history.doc !== lastSaved;

    async function saveCopy(document: EditorDocument) {
      const page = getPage(document);
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${store.get().name} (${t("conflictSuffix")})`.slice(0, 120),
          width: page.width,
          height: page.height,
          document,
        }),
      });
      if (!res.ok) throw new Error(`copy failed: ${res.status}`);
      const { id } = (await res.json()) as { id: string };
      await clearMirror(projectId);
      lastSaved = store.get().history.doc;
      toast.warning(t("conflictTitle"), { description: t("conflictBody") });
      router.replace(`/editor/${id}`);
    }

    async function save() {
      clearTimeout(saveTimer);
      if (disposed || inflight || !dirty()) {
        if (!dirty()) store.set({ saveStatus: "saved" });
        return;
      }
      if (!navigator.onLine) {
        store.set({ saveStatus: "offline" });
        return;
      }
      const { history, revision } = store.get();
      const doc = history.doc;
      inflight = true;
      store.set({ saveStatus: "saving" });
      try {
        const res = await fetch(`/api/v1/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: doc, revision }),
        });
        if (res.status === 409) {
          await saveCopy(doc);
          return;
        }
        if (!res.ok) {
          store.set({ saveStatus: "error" });
          toast.error(t("saveFailed"));
          return;
        }
        const body = (await res.json()) as { revision: number };
        lastSaved = doc;
        retryDelay = 2000;
        store.set({ revision: body.revision, saveStatus: dirty() ? "pending" : "saved" });
        if (dirty()) saveTimer = setTimeout(save, SAVE_DELAY);
        else await clearMirror(projectId);
        if (Date.now() - lastThumb > THUMB_EVERY) {
          lastThumb = Date.now();
          uploadThumbnail(store).catch((e) => console.warn("thumbnail upload failed", e));
        }
      } catch {
        // Network failure: keep the local mirror and retry with backoff.
        store.set({ saveStatus: "offline" });
        saveTimer = setTimeout(save, retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY);
      } finally {
        inflight = false;
      }
    }

    const unsubscribe = store.subscribe(() => {
      const { history, revision } = store.get();
      if (history.doc === lastSeen) return;
      lastSeen = history.doc;
      if (!dirty()) return;
      store.set({ saveStatus: navigator.onLine ? "pending" : "offline" });
      clearTimeout(mirrorTimer);
      mirrorTimer = setTimeout(() => {
        void writeMirror({ projectId, baseRevision: revision, document: history.doc, updatedAt: Date.now() });
      }, MIRROR_DELAY);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, SAVE_DELAY);
    });

    // Crash recovery: a local copy newer than the server's version.
    void readMirror(projectId).then(async (rec) => {
      if (!rec || disposed) return;
      let recovered: EditorDocument;
      try {
        recovered = migrate(rec.document);
      } catch {
        await clearMirror(projectId);
        return;
      }
      if (rec.baseRevision === store.get().revision) {
        store.replaceDocument(recovered);
        toast.info(t("recovered"));
        void save();
      } else {
        await saveCopy(recovered).catch(() => toast.error(t("saveFailed")));
      }
    });

    const onOnline = () => void save();
    const onOffline = () => dirty() && store.set({ saveStatus: "offline" });
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty()) e.preventDefault();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      disposed = true;
      unsubscribe();
      clearTimeout(saveTimer);
      clearTimeout(mirrorTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [store, router, t]);
}
