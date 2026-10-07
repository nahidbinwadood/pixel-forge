"use client";

import { ImagePlusIcon, Loader2Icon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { UploadDropzone } from "@/app/(app)/uploads/upload-dropzone";
import { useUploadFiles } from "@/app/(app)/uploads/use-upload-files";
import { Skeleton } from "@/components/ui/skeleton";
import { listItem, pressable } from "@/lib/motion";
import { imageNode } from "../factories";
import { useEditorStore } from "../store";
import { useActions } from "../use-actions";

interface PanelAsset {
  id: string;
  status: "processing" | "ready";
  name: string | null;
  thumbUrl: string | null;
  previewUrl: string | null;
  width: number | null;
  height: number | null;
}

const POLL_MS = 2000;

/** The user's uploads (existing assets API) + drop/browse to upload more. Click a photo to place it. */
export function UploadsPanel({ maxMb, userId }: { maxMb: number; userId: string }) {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const a = useActions();
  const { upload, uploading } = useUploadFiles({ maxMb, userId });
  const [items, setItems] = useState<PanelAsset[] | null>(null);
  const [failed, setFailed] = useState(false);
  const poll = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => {
    clearTimeout(poll.current);
    try {
      const res = await fetch("/api/v1/assets?kind=upload&limit=60");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: PanelAsset[] };
      setItems(data.items);
      setFailed(false);
      if (data.items.some((i) => i.status === "processing")) poll.current = setTimeout(load, POLL_MS);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => clearTimeout(poll.current);
  }, [load]);

  const place = (asset: PanelAsset) => {
    if (asset.status !== "ready" || !asset.previewUrl) return;
    store.set({ assetUrls: { ...store.get().assetUrls, [asset.id]: asset.previewUrl } });
    a.add(imageNode(store.page(), asset.id, asset.width ?? 1000, asset.height ?? 1000, asset.name ?? undefined));
  };

  return (
    <div className="grid gap-4">
      <UploadDropzone
        compact
        uploading={uploading}
        maxMb={maxMb}
        title={t("uploads.drop")}
        hint={t("uploads.hint", { maxMb })}
        onFiles={async (files) => {
          const done = await upload(files);
          if (done.length) void load();
        }}
      />
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {t("uploads.loadFailed")}{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => void load()}>
            {t("retry")}
          </button>
        </p>
      )}
      {items === null && !failed && (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      )}
      {items?.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-text-2">
          <ImagePlusIcon className="size-4" aria-hidden /> {t("uploads.empty")}
        </p>
      )}
      {items && items.length > 0 && (
        <ul className="grid grid-cols-2 gap-2">
          <AnimatePresence initial={false}>
            {items.map((asset) => (
              <m.li key={asset.id} layout variants={listItem} initial="hidden" animate="show" exit="exit">
                <m.button
                  type="button"
                  {...pressable}
                  disabled={asset.status !== "ready"}
                  onClick={() => place(asset)}
                  aria-label={t("uploads.place", { name: asset.name ?? t("uploads.photo") })}
                  className="relative block aspect-square w-full overflow-hidden rounded-2xl border bg-surface-3 transition-[border-color] hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-wait"
                >
                  {asset.thumbUrl && (
                    // biome-ignore lint/performance/noImgElement: presigned URL (CLAUDE.md: next/image except presigned)
                    <img
                      src={asset.thumbUrl}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  )}
                  {asset.status === "processing" && (
                    <span className="absolute inset-0 grid place-items-center bg-background/60 text-xs">
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                      <span className="sr-only">{t("uploads.processing")}</span>
                    </span>
                  )}
                </m.button>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
