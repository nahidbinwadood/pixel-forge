"use client";

import { cn } from "cn";
import { m } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/motion";

/** Empty state = what's missing, why it matters, what to do next (one action). */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <m.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative grid size-14 place-items-center rounded-2xl bg-surface-3 text-primary [&_svg]:size-6">
        <div aria-hidden className="absolute inset-0 -z-10 rounded-2xl bg-aurora opacity-25 blur-xl" />
        {icon}
      </div>
      <div className="grid max-w-sm gap-1.5">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </m.div>
  );
}
