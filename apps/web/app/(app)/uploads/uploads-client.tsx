"use client";

import { cn } from "cn";
import { ImageOffIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type DragEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { track } from "@/lib/analytics";
import { UploadError, uploadFile } from "./upload";

interface Asset {
  id: string;
  status: "processing" | "ready";
  name: string | null;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
}

export function UploadsClient({ maxMb, userId }: { maxMb: number; userId: string }) {
  const t = useTranslations("uploads");
  const tc = useTranslations("common");
  const [items, setItems] = useState<Asset[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<Asset | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Uploads we last saw as "processing". If one drops out of the list, the worker rejected it.
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

  const handleFiles = useCallback(
    async (files: Iterable<File>) => {
      const list = [...files];
      if (list.length === 0) return;
      setUploading((n) => n + list.length);
      await Promise.all(
        list.map(async (file) => {
          try {
            const id = await uploadFile(file, maxMb, t("unsupported"));
            pending.current.set(id, file.name);
            track("upload_completed", { mime: file.type, bytes: file.size }, userId);
          } catch (e) {
            const reason = e instanceof UploadError ? e.message : tc("error");
            toast.error(t("failed", { name: file.name, reason }));
          } finally {
            setUploading((n) => n - 1);
          }
        }),
      );
      await load();
    },
    [maxMb, t, tc, load, userId],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files?.length) void handleFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  }

  async function importUrl(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const url = String(new FormData(form).get("url"));
    // Fetched by the browser, never the server: no SSRF surface. Sites without CORS will fail, by design.
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const name = new URL(url).pathname.split("/").pop() || "image";
      await handleFiles([new File([blob], name, { type: blob.type })]);
      form.reset();
    } catch {
      toast.error(t("urlFailed"));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    const res = await fetch(`/api/v1/assets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev?.filter((a) => a.id !== id) ?? null);
      toast.success(t("deleted"));
    } else {
      toast.error(tc("error"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drop zone; the button inside is the keyboard path */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-primary bg-accent" : "border-border",
        )}
      >
        {uploading > 0 ? (
          <Loader2Icon className="size-8 animate-spin text-primary" aria-hidden />
        ) : (
          <UploadIcon className="size-8 text-muted-foreground" aria-hidden />
        )}
        <p>
          {t("drop")}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => fileInput.current?.click()}>
            {t("browse")}
          </Button>
        </p>
        <p className="text-xs text-muted-foreground">{t("types", { mb: maxMb })}</p>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          data-testid="file-input"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="sr-only" aria-live="polite">
          {uploading > 0 ? tc("loading") : ""}
        </p>
      </div>

      <form onSubmit={importUrl} className="flex max-w-xl items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="url">{t("fromUrl")}</Label>
          <Input id="url" name="url" type="url" required placeholder={t("urlPlaceholder")} />
        </div>
        <Button type="submit" variant="outline">
          {t("import")}
        </Button>
      </form>

      {loadError && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border p-4 text-sm">
          {tc("error")}
          <Button size="sm" variant="outline" onClick={() => void load()}>
            {tc("retry")}
          </Button>
        </div>
      )}

      {items === null && !loadError ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : items?.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label={t("title")}>
          {items?.map((a) => (
            <li key={a.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {a.status === "processing" ? (
                <div className="flex size-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2Icon className="size-5 animate-spin" aria-hidden />
                  {t("processing")}
                </div>
              ) : a.thumbUrl ? (
                // biome-ignore lint/performance/noImgElement: presigned URLs, not optimizable by next/image
                <img src={a.thumbUrl} alt={a.name ?? ""} className="size-full object-cover" loading="lazy" />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <ImageOffIcon className="size-5 text-muted-foreground" aria-hidden />
                </div>
              )}
              <Button
                size="icon"
                variant="secondary"
                aria-label={`${tc("delete")} ${a.name ?? ""}`}
                className="absolute top-2 right-2 size-8 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                onClick={() => setToDelete(a)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {cursor && (
        <Button variant="outline" className="self-center" onClick={() => void load(cursor)}>
          {t("loadMore")}
        </Button>
      )}

      <Dialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("delete")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tc("cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
