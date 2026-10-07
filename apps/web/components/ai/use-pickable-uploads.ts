"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUploadFiles } from "@/app/(app)/uploads/use-upload-files";

export interface PickableImage {
  id: string;
  name: string;
  thumbUrl: string | null;
}

interface AssetRow {
  id: string;
  status: "processing" | "ready";
  name: string | null;
  thumbUrl: string | null;
}

/**
 * Upload picker state for the background remover: the user's ready uploads, plus upload-in-place that
 * waits for the worker to finish processing and then hands back the new asset id.
 */
export function usePickableUploads({
  initial,
  maxMb,
  userId,
  onReady,
}: {
  initial: PickableImage[];
  maxMb: number;
  userId: string;
  onReady: (id: string) => void;
}) {
  const [items, setItems] = useState(initial);
  const [waiting, setWaiting] = useState<string[]>([]);
  const { upload, uploading } = useUploadFiles({ maxMb, userId });
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const refresh = useCallback(async () => {
    const res = await fetch("/api/v1/assets?kind=upload&limit=24", { cache: "no-store" });
    if (!res.ok) return [];
    const { items: rows } = (await res.json()) as { items: AssetRow[] };
    setItems(
      rows.filter((r) => r.status === "ready").map((r) => ({ id: r.id, name: r.name ?? "", thumbUrl: r.thumbUrl })),
    );
    return rows;
  }, []);

  // Poll while uploads are processing; select the first one that turns ready. Rejected ones drop out.
  useEffect(() => {
    if (waiting.length === 0) return;
    const id = setTimeout(async () => {
      const rows = await refresh();
      const byId = new Map(rows.map((r) => [r.id, r.status]));
      const ready = waiting.find((w) => byId.get(w) === "ready");
      if (ready) onReadyRef.current(ready);
      setWaiting((prev) => prev.filter((w) => byId.get(w) === "processing"));
    }, 1_200);
    return () => clearTimeout(id);
  }, [waiting, refresh]);

  const add = useCallback(
    async (files: File[]) => {
      const done = await upload(files.slice(0, 1));
      if (done.length) setWaiting((prev) => [...prev, ...done.map((d) => d.id)]);
    },
    [upload],
  );

  return { items, add, busy: uploading > 0 || waiting.length > 0, uploading };
}
