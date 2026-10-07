"use client";

import { ImageOffIcon, ImagesIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { liftHover, listItem } from "@/lib/motion";
import type { Asset } from "./use-uploads";

/** Presentational grid: skeleton → empty → cards, plus the delete confirmation. */
export function UploadGrid({ items, onDelete }: { items: Asset[] | null; onDelete: (id: string) => Promise<void> }) {
  const t = useTranslations("uploads");
  const [toDelete, setToDelete] = useState<Asset | null>(null);

  if (items === null) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true">
        {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((k) => (
          <Skeleton key={k} className="aspect-square rounded-2xl shimmer" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState icon={<ImagesIcon />} title={t("emptyTitle")} description={t("emptyBody")} />;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label={t("title")}>
        <AnimatePresence initial={false}>
          {items.map((a) => (
            <UploadCard key={a.id} asset={a} onDelete={() => setToDelete(a)} />
          ))}
        </AnimatePresence>
      </ul>
      <DeleteDialog
        asset={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const id = toDelete.id;
          setToDelete(null);
          await onDelete(id);
        }}
      />
    </>
  );
}

function UploadCard({ asset, onDelete }: { asset: Asset; onDelete: () => void }) {
  const t = useTranslations("uploads");
  const tc = useTranslations("common");
  return (
    <m.li
      layout
      variants={listItem}
      initial="hidden"
      animate="show"
      exit="exit"
      {...liftHover}
      className="group relative aspect-square overflow-hidden rounded-2xl border bg-surface-2 surface-highlight"
    >
      {asset.status === "processing" ? (
        <div className="flex size-full flex-col items-center justify-center gap-2 shimmer text-xs text-text-2">
          <span className="size-2 animate-pulse rounded-full bg-aurora" aria-hidden />
          {t("processing")}
        </div>
      ) : asset.thumbUrl ? (
        // biome-ignore lint/performance/noImgElement: presigned URLs, not optimizable by next/image
        <img
          src={asset.thumbUrl}
          alt={asset.name ?? ""}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <ImageOffIcon className="size-5 text-muted-foreground" aria-hidden />
        </div>
      )}

      {/* Action bar: shown on hover/focus; always shown on touch devices (no hover) */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-white">{asset.name}</span>
        <Button
          size="icon-sm"
          variant="glass"
          aria-label={`${tc("delete")} ${asset.name ?? ""}`}
          className="text-white"
          onClick={onDelete}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </m.li>
  );
}

function DeleteDialog({
  asset,
  onClose,
  onConfirm,
}: {
  asset: Asset | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("uploads");
  const tc = useTranslations("common");
  return (
    <Dialog open={asset !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tc("delete")}</DialogTitle>
          <DialogDescription>{t("deleteConfirm")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tc("cancel")}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            {tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
