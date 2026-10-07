"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ease, spring } from "@/lib/motion";

const CORNERS = [
  { pos: "-top-1.5 -left-1.5", d: "M1 13V1h12", from: { x: -10, y: -10 } },
  { pos: "-top-1.5 -right-1.5", d: "M1 1h12v12", from: { x: 10, y: -10 } },
  { pos: "-bottom-1.5 -left-1.5", d: "M1 1v12h12", from: { x: -10, y: 10 } },
  { pos: "-bottom-1.5 -right-1.5", d: "M13 1v12H1", from: { x: 10, y: 10 } },
] as const;

/**
 * The hero signature: the keyword framed like the editor's crop tool. L-shaped crop marks settle in from
 * outside, the frame and rule-of-thirds guides draw on, and a mono dimension tag hangs off the corner.
 * Purely decorative chrome (aria-hidden); the keyword text stays plain, selectable text.
 */
export function CropFrame({ children, tag }: { children: ReactNode; tag: string }) {
  const reduce = useReducedMotion();
  const delay = 0.55; // after the headline has landed

  return (
    <span className="relative mx-[0.08em] inline-block whitespace-nowrap px-[0.14em] pb-[0.04em]">
      <span aria-hidden className="pointer-events-none absolute inset-0">
        {/* frame + thirds */}
        <svg
          aria-hidden
          className="absolute inset-0 size-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <m.rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-primary/45"
            strokeWidth="1"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: ease.out, delay }}
          />
          {[33.33, 66.66].map((p) => (
            <m.g
              key={p}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: delay + 0.5 }}
            >
              <line
                x1={p}
                x2={p}
                y1="0"
                y2="100"
                vectorEffect="non-scaling-stroke"
                className="stroke-primary/15"
                strokeDasharray="3 4"
              />
              <line
                y1={p}
                y2={p}
                x1="0"
                x2="100"
                vectorEffect="non-scaling-stroke"
                className="stroke-primary/15"
                strokeDasharray="3 4"
              />
            </m.g>
          ))}
        </svg>
        {/* crop marks */}
        {CORNERS.map((c) => (
          <m.svg
            key={c.pos}
            aria-hidden
            viewBox="0 0 14 14"
            className={`absolute size-3.5 sm:size-5 ${c.pos}`}
            initial={reduce ? false : { ...c.from, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ ...spring.soft, delay: delay + 0.15 }}
          >
            <path d={c.d} fill="none" className="stroke-foreground" strokeWidth="2.5" strokeLinecap="square" />
          </m.svg>
        ))}
        {/* dimension tag */}
        <m.span
          className="absolute -top-8 -right-1 hidden rounded-md sm:block bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-normal text-background sm:-top-8 sm:text-xs"
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.ui, delay: delay + 0.7 }}
        >
          {tag}
        </m.span>
      </span>
      <span className="relative text-aurora">{children}</span>
    </span>
  );
}
