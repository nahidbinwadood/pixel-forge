"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { pastedFiles, useUploadFiles } from "./use-upload-files";

export interface Asset {
  id: string;
  status: "processing" | "ready";
  name: string | null;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
}

/**
 * Uploads page state (container logic, no markup): paged list, polling while the worker processes,
 * rejection detection, paste-to-upload and delete.
 */
export function useUploads({ maxMb, userId }: { maxMb: number; userId: string }) {
  const t = useTranslations("uploads");
  const tc = useTranslations("common");
  const { upload, uploading } = useUploadFiles({ maxMb, userId });
  const [items, setItems] = useState<Asset[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  // Uploads last seen as "processing". If one drops out of the list, the worker rejected it.
  const pending = useRef(new Map<string, string>());

  const load = useCallback(
    async (after?: string) => {
      try {
        const res = await fetch(`/api/v1/assets?kind=upload${after ? `&cursor=${after}` : ""}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { items: Asset[]; nextCursor: string | null };
        if (!after) {
          const seen = new Set(data.items.map((a) => a.id));
          for (const [id, name] of pending.current) {
            if (!seen.has(id)) toast.error(t("failed", { name, reason: t("unsupported") }));
          }
          pending.current = new Map(
            data.items.filter((a) => a.status === "processing").map((a) => [a.id, a.name ?? ""]),
          );
        }
        setItems((prev) => (after && prev ? [...prev, ...data.items] : data.items));
        setCursor(data.nextCursor);
        setLoadError(false);
      } catch {
        setLoadError(true);
      }
    },
    [t],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Poll while anything is processing; the worker usually finishes in a second or two.
  const processing = items?.some((a) => a.status === "processing") ?? false;
  useEffect(() => {
    if (!processing) return;
    const id = setInterval(() => void load(), 1500);
    return () => clearInterval(id);
  }, [processing, load]);

  const add = useCallback(
    async (files: Iterable<File>) => {
      const done = await upload(files);
      for (const f of done) pending.current.set(f.id, f.name);
      if (done.length) await load();
    },
    [upload, load],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = pastedFiles(e);
      if (files.length) void add(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [add]);

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/v1/assets/${id}`, { method: "DELETE" });
      if (!res.ok) return void toast.error(tc("error"));
      setItems((prev) => prev?.filter((a) => a.id !== id) ?? null);
      toast.success(t("deleted"));
    },
    [t, tc],
  );

  return { items, cursor, loadError, uploading, load, add, remove };
}
