"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/** Segment error boundary: says what happened and offers a retry; the shell stays usable. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10" role="alert">
      <EmptyState
        icon={<TriangleAlertIcon />}
        title={t("error")}
        description={tn("pageError")}
        action={
          <Button variant="secondary" onClick={reset}>
            <RotateCcwIcon aria-hidden />
            {t("retry")}
          </Button>
        }
      />
    </div>
  );
}
