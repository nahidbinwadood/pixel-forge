"use client";

import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { fadeUp, liftHover, listItem, scaleIn, stagger } from "@/lib/motion";
import { Specimen } from "./section";

export function MotionShowcase() {
  const [run, setRun] = useState(0);
  const [items, setItems] = useState([1, 2, 3]);
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-10">
      <Specimen label="fadeUp + stagger (orchestrated entry)" className="flex flex-col items-start gap-4">
        <m.div
          key={run}
          initial="hidden"
          animate="show"
          variants={stagger(0.08)}
          className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {["Upload", "Adjust", "Generate", "Export"].map((label) => (
            <m.div
              key={label}
              variants={fadeUp}
              className="rounded-2xl border bg-card p-4 text-sm font-medium surface-highlight"
            >
              {label}
            </m.div>
          ))}
        </m.div>
        <Button size="sm" variant="outline" onClick={() => setRun((r) => r + 1)}>
          Replay
        </Button>
      </Specimen>

      <Specimen label="liftHover (cards, tiles)" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["Hover", "or", "press", "me"].map((label) => (
          <m.button
            key={label}
            type="button"
            {...liftHover}
            className="rounded-2xl border bg-card p-6 text-sm font-medium surface-highlight hover:shadow-float"
          >
            {label}
          </m.button>
        ))}
      </Specimen>

      <Specimen label="listItem + layout (add / remove)" className="flex flex-col items-start gap-3">
        <ul className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {items.map((n) => (
              <m.li key={n} layout variants={listItem} initial="hidden" animate="show" exit="exit">
                <button
                  type="button"
                  onClick={() => setItems((xs) => xs.filter((x) => x !== n))}
                  className="rounded-xl border bg-card px-4 py-2 font-mono text-sm surface-highlight hover:border-destructive/50"
                  aria-label={`Remove item ${n}`}
                >
                  #{n}
                </button>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
        <Button size="sm" variant="outline" onClick={() => setItems((xs) => [...xs, (xs.at(-1) ?? 0) + 1])}>
          Add item
        </Button>
      </Specimen>

      <Specimen label="scaleIn (popovers, dialogs) via AnimatePresence" className="flex flex-col items-start gap-3">
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Toggle panel
        </Button>
        <div className="h-24">
          <AnimatePresence>
            {open && (
              <m.div
                variants={scaleIn}
                initial="hidden"
                animate="show"
                exit="exit"
                className="w-64 rounded-2xl p-4 text-sm glass shadow-float"
              >
                Floating UI uses glass and scaleIn.
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </Specimen>

      <Specimen label="Reveal (on scroll, once per section)" className="grid">
        <Reveal className="rounded-2xl border border-dashed p-6 text-sm text-text-2">
          Section content fades up when it enters the viewport. Use for sections, not every element.
        </Reveal>
      </Specimen>
    </div>
  );
}
