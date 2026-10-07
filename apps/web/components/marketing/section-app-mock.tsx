"use client";

import { CheckIcon } from "lucide-react";
import { animate, m, useInView, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { ease, spring } from "@/lib/motion";

interface Slider {
  label: string;
  value: number; // −100…100
}

/** HTML/CSS app-window mock for "How it works": canvas + adjust panel whose values count in on view. */
export function SectionAppMock({
  file,
  panel,
  exported,
  sliders,
}: {
  file: string;
  panel: string;
  exported: string;
  sliders: readonly Slider[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative" aria-hidden>
      <m.div
        initial={{ opacity: 0, y: 24, rotate: -1 }}
        animate={inView ? { opacity: 1, y: 0, rotate: 0 } : undefined}
        transition={spring.soft}
        className="overflow-hidden rounded-2xl border bg-surface-1 shadow-float"
      >
        <div className="flex items-center gap-3 border-b bg-surface-2/60 px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/80" />
            <span className="size-2.5 rounded-full bg-warning/80" />
            <span className="size-2.5 rounded-full bg-success/80" />
          </span>
          <span className="flex-1 truncate rounded-md bg-surface-3/70 px-3 py-1 font-mono text-[11px] text-text-2">
            pixelforge · {file}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_9.5rem] sm:grid-cols-[1fr_11rem]">
          <div className="relative aspect-[4/5] bg-[conic-gradient(var(--surface-3)_90deg,transparent_90deg_180deg,var(--surface-3)_180deg_270deg,transparent_270deg)] bg-[length:16px_16px] p-4 sm:p-6">
            <div className="relative size-full overflow-hidden rounded-md shadow-card">
              <Image
                src="/hero/street-vivid.webp"
                alt=""
                fill
                sizes="(min-width: 1024px) 28vw, 60vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="grid content-start gap-4 border-s p-3 sm:p-4">
            <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{panel}</p>
            {sliders.map((s, i) => (
              <SliderRow key={s.label} {...s} play={inView} delay={0.35 + i * 0.12} />
            ))}
          </div>
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : undefined}
        transition={{ ...spring.ui, delay: 1.1 }}
        className="absolute -bottom-4 start-4 flex items-center gap-2 rounded-full border bg-surface-1 px-3.5 py-2 text-xs font-medium shadow-float sm:-start-6"
      >
        <span className="grid size-5 place-items-center rounded-full bg-success/15 text-success">
          <CheckIcon className="size-3" />
        </span>
        <span className="font-mono">{exported}</span>
      </m.div>
    </div>
  );
}

function SliderRow({ label, value, play, delay }: Slider & { play: boolean; delay: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => {
    const r = Math.round(v);
    return r > 0 ? `+${r}` : String(r);
  });
  const width = useTransform(mv, (v) => `${50 + v / 2}%`);

  useEffect(() => {
    if (!play) return;
    const c = animate(mv, value, { duration: 1, ease: ease.out, delay });
    return () => c.stop();
  }, [play, value, delay, mv]);

  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-text-2">{label}</span>
        <m.span className="font-mono tabular-nums">{text}</m.span>
      </div>
      <div className="relative h-1.5 rounded-full bg-surface-3">
        <m.div className="absolute inset-y-0 start-0 rounded-full bg-aurora" style={{ width }} />
      </div>
    </div>
  );
}
