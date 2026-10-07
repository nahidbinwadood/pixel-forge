"use client";

import { cn } from "cn";
import { m, type Variants } from "motion/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { spring, stagger } from "@/lib/motion";

/** Entrance (inherits hidden/show from the grid's stagger). */
const entry: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring.soft },
};

/** Hover state; the tile's motif reacts via variant propagation ("rest" → "hover"). */
const lift: Variants = { rest: { y: 0 }, hover: { y: -4, transition: spring.ui } };

function EditorMotif() {
  const rows = [0.62, 0.35, 0.8];
  return (
    <div className="flex w-full max-w-64 flex-col gap-4" aria-hidden>
      {rows.map((v, i) => (
        <div key={v} className="relative h-1.5 rounded-full bg-surface-3">
          <m.div
            className="absolute inset-y-0 start-0 rounded-full bg-aurora"
            variants={{ rest: { width: `${v * 100}%` }, hover: { width: `${(1 - v * 0.6) * 100}%` } }}
            transition={{ ...spring.soft, delay: i * 0.05 }}
          />
          <m.div
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-white shadow-glow"
            variants={{ rest: { left: `${v * 100}%` }, hover: { left: `${(1 - v * 0.6) * 100}%` } }}
            transition={{ ...spring.soft, delay: i * 0.05 }}
          />
        </div>
      ))}
    </div>
  );
}

function CutoutMotif() {
  return (
    <div className="relative size-28" aria-hidden>
      {/* transparency checkerboard appears as the background "lifts" away */}
      <div className="absolute inset-0 rounded-xl bg-[conic-gradient(var(--surface-3)_25%,transparent_0_50%,var(--surface-3)_0_75%,transparent_0)] bg-[length:14px_14px]" />
      <m.div
        className="absolute inset-0 rounded-xl bg-surface-3"
        variants={{ rest: { opacity: 1 }, hover: { opacity: 0 } }}
        transition={{ duration: 0.3 }}
      />
      <m.div
        className="absolute inset-x-6 top-5 bottom-0 rounded-t-full bg-aurora"
        variants={{ rest: { y: 0, scale: 1 }, hover: { y: -6, scale: 1.04 } }}
        transition={spring.ui}
      />
    </div>
  );
}

function GenerateMotif() {
  return (
    <div className="grid grid-cols-2 gap-2" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="relative size-11 overflow-hidden rounded-lg bg-surface-3">
          <m.div
            className="absolute inset-0 bg-aurora"
            variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
          />
        </div>
      ))}
    </div>
  );
}

function TemplatesMotif() {
  return (
    <div className="relative h-24 w-20" aria-hidden>
      {[-14, 0, 14].map((r, i) => (
        <m.div
          key={r}
          className="absolute inset-0 rounded-lg border bg-surface-3 shadow-card"
          style={{ zIndex: i }}
          variants={{ rest: { rotate: r / 3, x: 0 }, hover: { rotate: r, x: r * 1.4 } }}
          transition={spring.ui}
        >
          <div className="m-2 h-2 w-1/2 rounded-full bg-foreground/15" />
          {i === 2 && <div className="mx-2 mt-8 h-6 rounded bg-aurora opacity-80" />}
        </m.div>
      ))}
    </div>
  );
}

function CollageMotif() {
  return (
    <m.div className="grid size-28 grid-cols-3 grid-rows-3 gap-1.5" aria-hidden>
      {[
        "col-span-2 row-span-2",
        "col-span-1 row-span-1",
        "col-span-1 row-span-2",
        "col-span-1 row-span-1",
        "col-span-1 row-span-1",
      ].map((span, i) => (
        <m.div
          key={span + String(i)}
          layout
          className={cn("rounded-md bg-surface-3", span, i === 0 && "bg-aurora opacity-80")}
          variants={{ rest: { scale: 1 }, hover: { scale: i === 0 ? 0.94 : 1.04 } }}
          transition={{ ...spring.ui, delay: i * 0.03 }}
        />
      ))}
    </m.div>
  );
}

function Tile({
  title,
  description,
  soon,
  soonLabel,
  motif,
  className,
}: {
  title: string;
  description: string;
  soon: boolean;
  soonLabel: string;
  motif: ReactNode;
  className?: string;
}) {
  return (
    <m.div variants={entry} className={cn("flex", className)}>
      <m.article
        variants={lift}
        initial="rest"
        animate="rest"
        whileHover="hover"
        className="relative flex w-full flex-col justify-between gap-8 overflow-hidden rounded-3xl border bg-card p-6 surface-highlight"
      >
        <div className="flex min-h-28 flex-1 items-center justify-center">{motif}</div>
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-h2">{title}</h3>
            {soon && <Badge variant="secondary">{soonLabel}</Badge>}
          </div>
          <p className="max-w-sm text-sm text-text-2">{description}</p>
        </div>
      </m.article>
    </m.div>
  );
}

/** Asymmetric bento of the core tools. Every tool here is on the roadmap but not live yet, so each says so. */
export function ToolBento() {
  const t = useTranslations("landing.tools");
  const soon = t("soon");
  return (
    <section id="tools" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mb-10 grid max-w-2xl gap-3">
        <h2 className="text-h1">{t("title")}</h2>
        <p className="text-lg text-text-2">{t("subtitle")}</p>
      </div>
      <m.div
        className="grid auto-rows-[minmax(15rem,auto)] gap-4 md:grid-cols-6"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger(0.07)}
      >
        <Tile
          className="md:col-span-4 md:row-span-2"
          title={t("editor")}
          description={t("editorDesc")}
          soon
          soonLabel={soon}
          motif={<EditorMotif />}
        />
        <Tile
          className="md:col-span-2"
          title={t("bgRemove")}
          description={t("bgRemoveDesc")}
          soon
          soonLabel={soon}
          motif={<CutoutMotif />}
        />
        <Tile
          className="md:col-span-2"
          title={t("aiImage")}
          description={t("aiImageDesc")}
          soon
          soonLabel={soon}
          motif={<GenerateMotif />}
        />
        <Tile
          className="md:col-span-3"
          title={t("templates")}
          description={t("templatesDesc")}
          soon
          soonLabel={soon}
          motif={<TemplatesMotif />}
        />
        <Tile
          className="md:col-span-3"
          title={t("collage")}
          description={t("collageDesc")}
          soon
          soonLabel={soon}
          motif={<CollageMotif />}
        />
      </m.div>
    </section>
  );
}
