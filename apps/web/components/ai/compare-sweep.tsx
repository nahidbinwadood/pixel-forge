"use client";

import { animate, m, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { type CSSProperties, type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { ease, spring } from "@/lib/motion";

/** Token-based transparency checkerboard so cut-outs read as cut-outs. */
const CHECKER: CSSProperties = {
  backgroundImage:
    "conic-gradient(var(--surface-3) 25%, var(--surface-1) 0 50%, var(--surface-3) 0 75%, var(--surface-1) 0)",
  backgroundSize: "20px 20px",
};

/**
 * Before/after for background removal, in the LightSweep idiom (brand/light-sweep.tsx) but for presigned
 * URLs and transparent results: left of the aurora band = cut-out, right = original. Drag or arrow keys.
 */
export function CompareSweep({
  before,
  after,
  labels,
}: {
  before: string;
  after: string;
  labels: { before: string; after: string; slider: string };
}) {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const pos = useMotionValue(reduce ? 60 : 0);
  const clip = useTransform(pos, (p) => `inset(0 ${100 - p}% 0 0)`);
  const left = useTransform(pos, (p) => `${p}%`);
  const [value, setValue] = useState(60);
  useMotionValueEvent(pos, "change", (v) => setValue(Math.round(v)));

  useEffect(() => {
    if (reduce) return;
    const c = animate(pos, [0, 78, 60], { duration: 1.8, ease: ease.out, times: [0, 0.6, 1], delay: 0.2 });
    return () => c.stop();
  }, [pos, reduce]);

  const fromPointer = (e: PointerEvent) => {
    const r = frame.current?.getBoundingClientRect();
    if (r) pos.set(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const d = { ArrowLeft: -step, ArrowRight: step, Home: -100, End: 100 }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    animate(pos, Math.min(100, Math.max(0, pos.get() + d)), spring.snappy);
  };

  return (
    <div
      ref={frame}
      className="relative touch-none overflow-hidden rounded-3xl border shadow-float select-none"
      style={CHECKER}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => e.buttons === 1 && fromPointer(e)}
    >
      {/* biome-ignore lint/performance/noImgElement: presigned URLs, not optimizable by next/image */}
      <img src={before} alt={labels.before} className="block max-h-[70vh] w-full object-contain" draggable={false} />
      <m.div className="absolute inset-0" style={{ clipPath: clip, ...CHECKER }}>
        {/* biome-ignore lint/performance/noImgElement: presigned URLs, not optimizable by next/image */}
        <img src={after} alt={labels.after} className="size-full object-contain" draggable={false} />
      </m.div>
      <m.div className="pointer-events-none absolute inset-y-0 -translate-x-1/2" style={{ left }}>
        <div className="absolute inset-y-0 left-1/2 w-20 -translate-x-1/2 bg-aurora opacity-30 blur-2xl" />
        <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-aurora shadow-glow" />
      </m.div>
      <m.div
        role="slider"
        tabIndex={0}
        aria-label={labels.slider}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}%`}
        onKeyDown={onKey}
        className="absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full glass shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
        style={{ left }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
        </svg>
      </m.div>
      <span className="pointer-events-none absolute start-3 top-3 rounded-full glass px-2.5 py-1 text-xs font-medium">
        {labels.after}
      </span>
      <span className="pointer-events-none absolute end-3 top-3 rounded-full glass px-2.5 py-1 text-xs font-medium text-text-2">
        {labels.before}
      </span>
    </div>
  );
}
