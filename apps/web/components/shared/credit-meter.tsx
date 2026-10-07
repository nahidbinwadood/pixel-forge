"use client";

import { cn } from "cn";
import { animate, m, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

/**
 * Credits as an aurora ring (fill = balance vs monthly allowance) + count-up number.
 * Text carries the meaning; the ring is decorative (color is never the only signal).
 */
export function CreditMeter({
  balance,
  allowance,
  label,
  className,
}: {
  balance: number;
  allowance: number;
  label: string;
  className?: string;
}) {
  const ratio = allowance > 0 ? Math.min(1, balance / allowance) : 0;
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const c = animate(count, balance, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [balance, count]);

  const r = 9;
  const circ = 2 * Math.PI * r;

  return (
    <div
      className={cn("inline-flex items-center gap-2 rounded-full border bg-surface-1/70 py-1 ps-1 pe-3", className)}
      title={label}
    >
      <svg viewBox="0 0 24 24" className="size-7 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="credit-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--aurora-1)" />
            <stop offset="1" stopColor="var(--aurora-3)" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="3" />
        <m.circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="url(#credit-ring)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - ratio) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="font-mono text-sm font-medium tabular-nums">
        <m.span>{rounded}</m.span>
        <span className="sr-only"> {label}</span>
      </span>
    </div>
  );
}
