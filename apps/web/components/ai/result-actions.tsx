"use client";

import { CheckIcon, DownloadIcon, FolderPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Fetch → blob → object URL, because `download` is ignored on cross-origin (presigned) links. */
async function downloadUrl(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const href = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 1_000);
}

/** Download + Save to library for one AI image. Save is idempotent server-side. */
export function ResultActions({ assetId, url, filename }: { assetId: string; url: string; filename: string }) {
  const t = useTranslations("ai.result");
  const te = useTranslations("ai.errors");
  const tc = useTranslations("common");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/ai/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      toast.success(t("saved"));
    } catch {
      toast.error(tc("error"));
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadUrl(url, filename);
    } catch {
      toast.error(te("downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={download} loading={downloading}>
        <DownloadIcon aria-hidden />
        {t("download")}
      </Button>
      <Button variant="secondary" size="sm" onClick={save} loading={saving} disabled={saved}>
        {saved ? <CheckIcon aria-hidden /> : <FolderPlusIcon aria-hidden />}
        {saved ? t("savedShort") : t("save")}
      </Button>
    </div>
  );
}
