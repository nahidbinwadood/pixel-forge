"use client";

import type { ShapeNode } from "@pixelforge/editor-core";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { pressable } from "@/lib/motion";
import { shapeNode } from "../factories";
import { useEditorStore } from "../store";
import { useActions } from "../use-actions";

/** Icon previews drawn with currentColor, so they follow the theme. */
const SHAPES: ReadonlyArray<{ id: ShapeNode["shape"]; svg: React.ReactNode }> = [
  { id: "rect", svg: <rect x="4" y="4" width="32" height="32" rx="4" /> },
  { id: "ellipse", svg: <circle cx="20" cy="20" r="16" /> },
  { id: "triangle", svg: <polygon points="20,4 36,36 4,36" /> },
  { id: "star", svg: <polygon points="20,3 25,15 38,15 27,23 31,36 20,28 9,36 13,23 2,15 15,15" /> },
  { id: "polygon", svg: <polygon points="20,3 36,14 30,35 10,35 4,14" /> },
  { id: "line", svg: <rect x="2" y="18" width="36" height="4" rx="2" /> },
];

export function ShapesPanel() {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const a = useActions();
  return (
    <div className="grid grid-cols-3 gap-2">
      {SHAPES.map((s) => (
        <m.button
          key={s.id}
          type="button"
          {...pressable}
          aria-label={t("shapes.add", { shape: t(`shapes.${s.id}`) })}
          data-testid={`add-shape-${s.id}`}
          onClick={() => a.add(shapeNode(store.page(), s.id))}
          className="grid aspect-square place-items-center rounded-2xl border bg-surface-2 text-primary transition-colors hover:border-primary/40 hover:bg-surface-3 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <svg viewBox="0 0 40 40" className="size-9 fill-current" aria-hidden>
            {s.svg}
          </svg>
        </m.button>
      ))}
    </div>
  );
}
