"use client";

import { cn } from "cn";
import { ImagePlusIcon, Loader2Icon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { type DragEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif";

/**
 * Drop target + file picker. `compact` is the Home quick-drop variant.
 * Keyboard path = the Browse button; the drop area itself is pointer-only by nature.
 */
export function UploadDropzone({
  onFiles,
  uploading,
  maxMb,
  compact = false,
  title,
  hint,
  className,
}: {
  onFiles: (files: File[]) => void;
  uploading: number;
  maxMb: number;
  compact?: boolean;
  title?: string;
  hint?: string;
  className?: string;
}) {
  const t = useTranslations("uploads");
  const tc = useTranslations("common");
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = uploading > 0;

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onFiles([...e.dataTransfer.files]);
  };

  return (
    <m.div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
      animate={{ scale: dragging ? 1.01 : 1 }}
      transition={spring.ui}
      className={cn(
        "group relative isolate flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed text-center transition-colors",
        compact ? "gap-3 px-5 py-6" : "gap-5 px-6 py-14 md:py-20",
        dragging ? "border-primary bg-accent/40" : "border-input bg-surface-1/50 hover:border-foreground/25",
        className,
      )}
    >
      {/* The light: an aurora wash that intensifies while dragging */}
      <m.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-mesh"
        animate={{ opacity: dragging ? 1 : compact ? 0.25 : 0.45 }}
        transition={{ duration: 0.3 }}
      />
      <m.div
        className={cn(
          "grid place-items-center rounded-2xl bg-aurora text-aurora-ink shadow-glow",
          compact ? "size-11" : "size-16",
        )}
        animate={dragging ? { y: -4, rotate: -6 } : { y: 0, rotate: 0 }}
        transition={spring.ui}
      >
        {busy ? (
          <Loader2Icon className={cn("animate-spin", compact ? "size-5" : "size-7")} aria-hidden />
        ) : (
          <ImagePlusIcon className={compact ? "size-5" : "size-7"} aria-hidden />
        )}
      </m.div>

      <div className="grid gap-1.5">
        <AnimatePresence mode="wait" initial={false}>
          <m.p
            key={dragging ? "active" : "idle"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn("font-display font-semibold", compact ? "text-base" : "text-h2")}
          >
            {dragging ? t("dropActive") : (title ?? t("drop"))}
          </m.p>
        </AnimatePresence>
        <p className="text-sm text-text-2">{hint ?? t("dropHint")}</p>
      </div>

      <Button
        type="button"
        variant={compact ? "secondary" : "default"}
        size={compact ? "sm" : "lg"}
        onClick={() => input.current?.click()}
        loading={busy}
      >
        {t("browse")}
      </Button>
      {!compact && <p className="font-mono text-xs text-muted-foreground">{t("types", { mb: maxMb })}</p>}

      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="file-input"
        onChange={(e) => {
          if (e.target.files) onFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
      <p className="sr-only" aria-live="polite">
        {busy ? t("uploading", { count: uploading }) : ""}
      </p>
      {busy && <span className="sr-only">{tc("loading")}</span>}
    </m.div>
  );
}
