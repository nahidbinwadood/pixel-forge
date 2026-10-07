"use client";

import { cn } from "cn";
import { ImagesIcon, LayersIcon, type LucideIcon, ShapesIcon, SparklesIcon, TypeIcon, XIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { ElementsPanel } from "./panels/elements-panel";
import { LayersPanel } from "./panels/layers-panel";
import { ShapesPanel } from "./panels/shapes-panel";
import { TextPanel } from "./panels/text-panel";
import { UploadsPanel } from "./panels/uploads-panel";
import { type Panel, useEditor, useEditorStore } from "./store";

const RAIL: ReadonlyArray<{ id: Exclude<Panel, null>; icon: LucideIcon }> = [
  { id: "uploads", icon: ImagesIcon },
  { id: "text", icon: TypeIcon },
  { id: "shapes", icon: ShapesIcon },
  { id: "elements", icon: SparklesIcon },
  { id: "layers", icon: LayersIcon },
];

/** Icon-first left rail; each item toggles a flyout panel next to the canvas. */
export function LeftRail({ maxMb, userId }: { maxMb: number; userId: string }) {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const panel = useEditor((s) => s.panel);

  const content: Record<Exclude<Panel, null>, ReactNode> = {
    uploads: <UploadsPanel maxMb={maxMb} userId={userId} />,
    text: <TextPanel />,
    shapes: <ShapesPanel />,
    elements: <ElementsPanel />,
    layers: <LayersPanel />,
  };

  return (
    <div className="flex h-full shrink-0">
      <nav
        aria-label={t("toolsLabel")}
        className="flex w-[4.5rem] flex-col items-center gap-1 border-e bg-surface-1 py-3"
      >
        {RAIL.map(({ id, icon: Icon }) => {
          const active = panel === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              aria-controls="editor-flyout"
              data-testid={`rail-${id}`}
              onClick={() => store.set({ panel: active ? null : id })}
              className={cn(
                "relative flex w-14 flex-col items-center gap-1 rounded-2xl py-2 text-[0.6875rem] font-medium text-text-2 transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                active && "text-foreground",
              )}
            >
              {active && (
                <m.span
                  layoutId="rail-active"
                  className="absolute inset-0 rounded-2xl bg-primary/10"
                  transition={{ duration: duration.micro, ease: ease.out }}
                  aria-hidden
                />
              )}
              <Icon className={cn("relative size-5", active && "text-primary")} aria-hidden />
              <span className="relative">{t(`rail.${id}`)}</span>
            </button>
          );
        })}
      </nav>
      <AnimatePresence initial={false}>
        {panel && (
          <m.section
            key="flyout"
            id="editor-flyout"
            aria-label={t(`rail.${panel}`)}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: duration.micro, ease: ease.out }}
            className="flex w-72 flex-col border-e bg-surface-1"
          >
            <header className="flex h-12 shrink-0 items-center justify-between ps-4 pe-2">
              <h2 className="font-display text-base font-semibold">{t(`rail.${panel}`)}</h2>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("closePanel")}
                onClick={() => store.set({ panel: null })}
              >
                <XIcon aria-hidden />
              </Button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{content[panel]}</div>
          </m.section>
        )}
      </AnimatePresence>
    </div>
  );
}
