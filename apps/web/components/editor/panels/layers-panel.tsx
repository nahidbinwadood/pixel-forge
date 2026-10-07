"use client";

import { layersTopFirst, type Node, reorder, setFlag } from "@pixelforge/editor-core";
import { cn } from "cn";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  LockIcon,
  type LucideIcon,
  ShapesIcon,
  SmileIcon,
  TypeIcon,
  UnlockIcon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { listItem } from "@/lib/motion";
import { useEditor, useEditorStore, usePage } from "../store";

const ICON: Record<Exclude<Node["type"], "group">, LucideIcon> = {
  text: TypeIcon,
  image: ImageIcon,
  shape: ShapesIcon,
  sticker: SmileIcon,
};

/** Layers, top of the stack first: select, show/hide, lock, move up/down. */
export function LayersPanel() {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const page = usePage();
  const selection = useEditor((s) => s.selection);
  const layers = layersTopFirst(page).filter((n) => n.type !== "group");

  if (layers.length === 0) return <p className="text-sm text-text-2">{t("layers.empty")}</p>;

  const label = (n: Node) => (n.type === "text" ? n.text.slice(0, 40) : n.name) || t(`layers.type.${n.type}`);

  return (
    <ul className="grid gap-1" aria-label={t("rail.layers")}>
      <AnimatePresence initial={false}>
        {layers.map((n, i) => {
          const Icon = ICON[n.type];
          const selected = selection.includes(n.id);
          return (
            <m.li
              key={n.id}
              layout
              variants={listItem}
              initial="hidden"
              animate="show"
              exit="exit"
              className={cn(
                "group flex items-center gap-1 rounded-xl border border-transparent ps-1 pe-0.5",
                selected ? "border-primary/40 bg-primary/8" : "hover:bg-secondary",
                n.groupId && "ms-3",
              )}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={(e) => store.select([n.id], e.shiftKey || e.metaKey || e.ctrlKey)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-2 text-start text-sm focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  n.hidden && "text-muted-foreground line-through",
                )}
              >
                <Icon className="size-4 shrink-0 text-text-2" aria-hidden />
                <span className="truncate">{label(n)}</span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={t("layers.up", { name: label(n) })}
                disabled={i === 0}
                onClick={() => store.run(reorder([n.id], "forward"), "Reorder")}
              >
                <ChevronUpIcon aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={t("layers.down", { name: label(n) })}
                disabled={i === layers.length - 1}
                onClick={() => store.run(reorder([n.id], "backward"), "Reorder")}
              >
                <ChevronDownIcon aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-pressed={n.hidden}
                aria-label={t(n.hidden ? "layers.show" : "layers.hide", { name: label(n) })}
                onClick={() => store.run(setFlag([n.id], "hidden", !n.hidden), n.hidden ? "Show" : "Hide")}
              >
                {n.hidden ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-pressed={n.locked}
                aria-label={t(n.locked ? "layers.unlock" : "layers.lock", { name: label(n) })}
                onClick={() => store.run(setFlag([n.id], "locked", !n.locked), n.locked ? "Unlock" : "Lock")}
              >
                {n.locked ? <LockIcon aria-hidden /> : <UnlockIcon aria-hidden />}
              </Button>
            </m.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
