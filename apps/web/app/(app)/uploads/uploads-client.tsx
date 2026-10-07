"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "./upload-dropzone";
import { UploadGrid } from "./upload-grid";
import { UrlImport } from "./url-import";
import { useUploads } from "./use-uploads";

/** Composes the Uploads page: dropzone hero → URL import → library grid. State lives in useUploads. */
export function UploadsClient({ maxMb, userId }: { maxMb: number; userId: string }) {
  const t = useTranslations("uploads");
  const tc = useTranslations("common");
  const { items, cursor, loadError, uploading, load, add, remove } = useUploads({ maxMb, userId });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <UploadDropzone onFiles={(files) => void add(files)} uploading={uploading} maxMb={maxMb} />
        <UrlImport onFile={(file) => add([file])} />
      </div>

      {loadError && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-destructive/30 p-4 text-sm">
          {tc("error")}
          <Button size="sm" variant="outline" onClick={() => void load()}>
            {tc("retry")}
          </Button>
        </div>
      )}

      {!loadError && <UploadGrid items={items} onDelete={remove} />}

      {cursor && (
        <Button variant="secondary" className="self-center" onClick={() => void load(cursor)}>
          {t("loadMore")}
        </Button>
      )}
    </div>
  );
}
