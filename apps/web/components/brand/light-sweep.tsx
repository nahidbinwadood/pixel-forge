"use client";

import { cn } from "cn";
import {
  AnimatePresence,
  animate,
  m,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { duration, ease, spring } from "@/lib/motion";

export interface SweepPreset {
  id: string;
  label: string;
  src: string;
}

/**
 * The PixelForge signature (docs/design/AUDIT.md §3): a band of aurora light that transforms what it passes.
 * Left of the band = edited, right = original. Drag the band (or use arrow keys) to compare.
 * Presets switch the edit with a crossfade. Intro sweep runs once and is skipped under reduced motion.
 */
export function LightSweep({
  original,
  presets,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  className,
  showChips = true,
}: {
  original: string;
  presets: readonly SweepPreset[];
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  showChips?: boolean;
}) {
  const reduce = useReducedMotion();
  const [presetId, setPresetId] = useState(presets[0]?.id);
  const preset = presets.find((p) => p.id === presetId) ?? presets[0];
  const frame = useRef<HTMLDivElement>(null);
  const pos = useMotionValue(reduce ? 55 : 0); // percent of width revealed as "edited"
  const clip = useTransform(pos, (p) => `inset(0 ${100 - p}% 0 0)`);
  const left = useTransform(pos, (p) => `${p}%`);
  const [valueText, setValueText] = useState(55);
  useMotionValueEvent(pos, "change", (v) => setValueText(Math.round(v)));

  useEffect(() => {
    if (reduce) return;
    const controls = animate(pos, [0, 72, 55], { duration: 2.2, ease: ease.out, times: [0, 0.6, 1], delay: 0.4 });
    return () => controls.stop();
  }, [pos, reduce]);

  const setFromPointer = (e: PointerEvent) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    pos.set(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
  };

  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const next = { ArrowLeft: -step, ArrowRight: step, Home: -100, End: 100 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    animate(pos, Math.min(100, Math.max(0, pos.get() + next)), spring.snappy);
  };

  if (!preset) return null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        ref={frame}
        className="relative aspect-[4/3] touch-none overflow-hidden rounded-3xl border bg-surface-2 shadow-float select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e);
        }}
        onPointerMove={(e) => e.buttons === 1 && setFromPointer(e)}
      >
        {/* Original (bottom layer) */}
        <Image src={original} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />

        {/* Edited (clipped to the revealed side) */}
        <m.div className="absolute inset-0" style={{ clipPath: clip }}>
          <AnimatePresence initial={false}>
            <m.div
              key={preset.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.panel, ease: ease.out }}
            >
              <Image src={preset.src} alt="" fill sizes={sizes} className="object-cover" priority={priority} />
            </m.div>
          </AnimatePresence>
        </m.div>

        {/* The aurora band + handle */}
        <m.div className="pointer-events-none absolute inset-y-0 -translate-x-1/2" style={{ left }}>
          <div className="absolute inset-y-0 left-1/2 w-24 -translate-x-1/2 bg-aurora opacity-35 blur-2xl" />
          <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-aurora shadow-glow" />
        </m.div>
        <m.div
          role="slider"
          tabIndex={0}
          aria-label="Compare edited and original"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={valueText}
          aria-valuetext={`${valueText}% edited`}
          onKeyDown={onKey}
          className="absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full glass shadow-glow focus-visible:ring-4 focus-visible:ring-ring/50"
          style={{ left }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5 text-foreground"
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
          {preset.label}
        </span>
        <span className="pointer-events-none absolute end-3 top-3 rounded-full glass px-2.5 py-1 text-xs font-medium text-text-2">
          Original
        </span>
      </div>

      {showChips && presets.length > 1 && (
        <div role="radiogroup" aria-label="Edit preset" className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = p.id === preset.id;
            return (
              <m.button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPresetId(p.id)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative isolate rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "border-transparent text-aurora-ink" : "text-text-2 hover:text-foreground",
                )}
              >
                {active && (
                  <m.span
                    layoutId="sweep-chip"
                    className="absolute inset-0 -z-10 rounded-full bg-aurora"
                    transition={spring.ui}
                  />
                )}
                {p.label}
              </m.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
