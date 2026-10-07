"use client";

import { cn } from "cn";
import { m } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, spring } from "@/lib/motion";

/** One dependency check: status pill (text, not color alone), latency in mono, raw detail. */
export function HealthCard({
  index,
  name,
  icon,
  ok,
  ms,
  detail,
  okLabel,
  downLabel,
  latencyLabel,
}: {
  index: number;
  name: string;
  icon: ReactNode;
  ok: boolean;
  ms: number;
  detail?: string;
  okLabel: string;
  downLabel: string;
  latencyLabel: string;
}) {
  return (
    <m.article
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ delay: index * 0.06 }}
      className={cn(
        "flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 surface-highlight",
        !ok && "border-destructive/40",
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 text-sm font-semibold">
          <span
            className="grid size-8 place-items-center rounded-lg bg-secondary text-text-2 [&_svg]:size-4"
            aria-hidden
          >
            {icon}
          </span>
          {name}
        </span>
        <m.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring.snappy, delay: 0.15 + index * 0.06 }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          <span className="relative flex size-2" aria-hidden>
            {ok && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />}
            <span className={cn("relative inline-flex size-2 rounded-full", ok ? "bg-success" : "bg-destructive")} />
          </span>
          {ok ? okLabel : downLabel}
        </m.span>
      </header>
      <div className="grid gap-0.5">
        <span className="text-xs text-muted-foreground">{latencyLabel}</span>
        <span className="font-mono text-2xl font-medium tabular-nums">
          {ms}
          <span className="ms-1 text-sm text-muted-foreground">ms</span>
        </span>
      </div>
      {detail && <p className="break-words font-mono text-xs text-muted-foreground">{detail}</p>}
    </m.article>
  );
}
