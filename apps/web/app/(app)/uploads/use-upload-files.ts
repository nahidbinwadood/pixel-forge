"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { UploadError, uploadFile } from "./upload";

export interface UploadedFile {
  id: string;
  name: string;
}

/**
 * Upload a batch of files (presign → PUT → complete), with per-file error toasts.
 * Shared by the Uploads page and the Home quick-drop. Returns the files that reached processing.
 */
export function useUploadFiles({ maxMb, userId }: { maxMb: number; userId: string }) {
  const t = useTranslations("uploads");
  const tc = useTranslations("common");
  const [uploading, setUploading] = useState(0);

  const upload = useCallback(
    async (files: Iterable<File>): Promise<UploadedFile[]> => {
      const list = [...files];
      if (list.length === 0) return [];
      setUploading((n) => n + list.length);
      const results = await Promise.all(
        list.map(async (file): Promise<UploadedFile | null> => {
          try {
            const id = await uploadFile(file, maxMb, t("unsupported"));
            track("upload_completed", { mime: file.type, bytes: file.size }, userId);
            return { id, name: file.name };
          } catch (e) {
            const reason = e instanceof UploadError ? e.message : tc("error");
            toast.error(t("failed", { name: file.name, reason }));
            return null;
          } finally {
            setUploading((n) => n - 1);
          }
        }),
      );
      return results.filter((r): r is UploadedFile => r !== null);
    },
    [maxMb, userId, t, tc],
  );

  return { upload, uploading };
}

/** Window-level paste → files. Ignores pastes into text fields. */
export function pastedFiles(e: ClipboardEvent): File[] {
  const target = e.target;
  if (target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return [];
  return [...(e.clipboardData?.files ?? [])];
}
