"use client";

import { ArrowUpRightIcon, ImageIcon, PenLineIcon, ScissorsIcon } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { fadeUp, liftHover, stagger } from "@/lib/motion";

const ICONS = { text_to_image: ImageIcon, bg_remove: ScissorsIcon, write: PenLineIcon } as const;
const MLink = m.create(Link);

/** Hub tile: icon, name, one-line description and the credit cost up front. */
export function ToolCard({
  tool,
  href,
  name,
  desc,
  cost,
}: {
  tool: keyof typeof ICONS;
  href: string;
  name: string;
  desc: string;
  cost: string;
}) {
  const Icon = ICONS[tool];
  return (
    <m.li variants={fadeUp} className="list-none">
      <MLink
        href={href}
        {...liftHover}
        className="group flex h-full flex-col gap-5 rounded-3xl border bg-surface-2 p-6 surface-highlight transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
      >
        <div className="flex items-start justify-between">
          <span className="grid size-12 place-items-center rounded-2xl bg-aurora text-aurora-ink shadow-glow">
            <Icon className="size-5" aria-hidden />
          </span>
          <ArrowUpRightIcon
            className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </div>
        <div className="grid gap-1.5">
          <h2 className="font-display text-xl font-semibold">{name}</h2>
          <p className="text-sm text-text-2">{desc}</p>
        </div>
        <span className="mt-auto w-fit rounded-full border bg-surface-1 px-3 py-1 font-mono text-xs tabular-nums">
          {cost}
        </span>
      </MLink>
    </m.li>
  );
}

/** Staggered grid wrapper for the tool tiles (one orchestrated entrance). */
export function ToolGrid({ children }: { children: ReactNode }) {
  return (
    <m.ul initial="hidden" animate="show" variants={stagger()} className="grid gap-4 md:grid-cols-3">
      {children}
    </m.ul>
  );
}
