"use client";

import { cn } from "cn";
import { SparklesIcon } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { fadeIn } from "@/lib/motion";
import type { JobStatus } from "./types";

/**
 * Generating state (AUDIT: aurora = transformation): shimmer tiles in the result's shape, the real job status
 * and elapsed time. Progress is indeterminate on purpose; we don't invent percentages we don't have.
 */
export function GeneratingState({
  status,
  tiles = 1,
  aspect = "1 / 1",
  className,
}: {
  status: JobStatus | "submitting";
  tiles?: number;
  aspect?: string;
  className?: string;
}) {
  const t = useTranslations("ai.status");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const label = status === "queued" || status === "submitting" ? t("queued") : t("running");

  return (
    <m.div initial="hidden" animate="show" variants={fadeIn} className={cn("grid gap-4", className)} aria-busy="true">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-aurora px-3 py-1 text-sm font-semibold text-aurora-ink shadow-glow">
          <SparklesIcon className="size-4 animate-pulse" aria-hidden />
          {label}
        </span>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">{t("elapsed", { seconds })}</span>
      </div>
      <div className="relative h-1 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-label={label}>
        <m.div
          className="absolute inset-y-0 w-1/3 rounded-full bg-aurora"
          initial={{ x: "-100%" }}
          animate={{ x: "300%" }}
          transition={{ duration: 1.4, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
        />
      </div>
      <div className={cn("grid gap-4", tiles > 1 && "sm:grid-cols-2")}>
        {Array.from({ length: tiles }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder tiles
            key={i}
            className="shimmer rounded-2xl border bg-surface-2"
            style={{ aspectRatio: aspect }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t("working")}</p>
    </m.div>
  );
}
