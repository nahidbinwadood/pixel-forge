"use client";

import { ArrowLeftIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function EditorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("editor");
  const tc = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid min-h-dvh place-items-center p-6" role="alert">
      <EmptyState
        icon={<TriangleAlertIcon />}
        title={t("loadError")}
        description={t("loadErrorBody")}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <Link href="/projects">
                <ArrowLeftIcon aria-hidden /> {t("back")}
              </Link>
            </Button>
            <Button onClick={reset}>
              <RotateCcwIcon aria-hidden /> {tc("retry")}
            </Button>
          </div>
        }
      />
    </div>
  );
}
