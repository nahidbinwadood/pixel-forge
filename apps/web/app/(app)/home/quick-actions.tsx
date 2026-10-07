"use client";

import { cn } from "cn";
import { ArrowUpRightIcon, UploadIcon } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { liftHover } from "@/lib/motion";
import { UploadDropzone } from "../uploads/upload-dropzone";
import { pastedFiles, useUploadFiles } from "../uploads/use-upload-files";

const MLink = m.create(Link);

/** The two things you can do today: go to Uploads, or drop/paste an image right here. */
export function QuickActions({ maxMb, userId, className }: { maxMb: number; userId: string; className?: string }) {
  const t = useTranslations("home");
  const router = useRouter();
  const { upload, uploading } = useUploadFiles({ maxMb, userId });

  const add = useCallback(
    async (files: File[]) => {
      const done = await upload(files);
      for (const f of done) toast.success(t("uploaded", { name: f.name }));
      if (done.length) router.refresh();
    },
    [upload, t, router],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = pastedFiles(e);
      if (files.length) void add(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [add]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <MLink
        href="/uploads"
        {...liftHover}
        className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border bg-surface-2 p-5 surface-highlight transition-colors hover:border-primary/40"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-aurora text-aurora-ink shadow-glow">
          <UploadIcon className="size-5" aria-hidden />
        </span>
        <span className="grid flex-1 gap-0.5">
          <span className="font-display text-lg font-semibold">{t("uploadPhoto")}</span>
          <span className="text-sm text-text-2">{t("uploadPhotoDesc")}</span>
        </span>
        <ArrowUpRightIcon
          className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </MLink>

      <UploadDropzone
        compact
        onFiles={(files) => void add(files)}
        uploading={uploading}
        maxMb={maxMb}
        title={t("quickDrop")}
        hint={t("quickDropDesc")}
        className="flex-1"
      />
    </div>
  );
}
