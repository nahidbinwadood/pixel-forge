"use client";

import { type Fill, parseNode, type ShapeNode, setBackground } from "@pixelforge/editor-core";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { pressable } from "@/lib/motion";
import { shapeNode } from "../factories";
import { useEditorStore } from "../store";
import { useActions } from "../use-actions";

/**
 * Built-in elements: gradient shapes and page backgrounds. These are document *content* colors (what the
 * user's design contains), so they are hex values rather than UI tokens. The sticker/stock library ships
 * with the content libraries (Templates area).
 */
const GRADIENTS: ReadonlyArray<{ id: string; shape: ShapeNode["shape"]; fill: Fill }> = [
  { id: "sunrise", shape: "ellipse", fill: lin(135, "#ff7a59", "#ffd166") },
  { id: "lagoon", shape: "rect", fill: lin(90, "#06b6d4", "#3b82f6") },
  { id: "violet", shape: "star", fill: lin(45, "#7c5cff", "#ec4899") },
  { id: "mint", shape: "polygon", fill: lin(160, "#34d399", "#a7f3d0") },
  { id: "ember", shape: "triangle", fill: lin(200, "#f97316", "#ef4444") },
  { id: "night", shape: "rect", fill: lin(120, "#1e1b4b", "#4c1d95") },
];

const BACKGROUNDS: readonly Fill[] = [
  { type: "solid", color: "#ffffff" },
  { type: "solid", color: "#f5f1ea" },
  { type: "solid", color: "#10112a" },
  { type: "solid", color: "#ffd166" },
  lin(135, "#fbcfe8", "#c7d2fe"),
  lin(90, "#0ea5e9", "#22d3ee"),
  lin(160, "#fde68a", "#fca5a5"),
  lin(45, "#312e81", "#7c3aed"),
];

function lin(angle: number, a: string, b: string): Fill {
  return {
    type: "linear",
    angle,
    stops: [
      { offset: 0, color: a },
      { offset: 1, color: b },
    ],
  };
}

const css = (f: Fill) =>
  f.type === "solid"
    ? f.color
    : `linear-gradient(${f.angle + 90}deg, ${f.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`;

const tile =
  "aspect-square rounded-2xl border transition-[border-color,box-shadow] hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none";

export function ElementsPanel() {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const a = useActions();

  return (
    <div className="grid gap-5">
      <section className="grid gap-2">
        <h3 className="text-sm font-medium">{t("elements.shapes")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {GRADIENTS.map((g) => (
            <m.button
              key={g.id}
              type="button"
              {...pressable}
              aria-label={t("elements.add", { name: t(`elements.names.${g.id}`) })}
              className={tile}
              style={{ background: css(g.fill) }}
              onClick={() => {
                const base = shapeNode(store.page(), g.shape);
                a.add(parseNode({ ...base, fill: g.fill, name: g.id } as ShapeNode));
              }}
            />
          ))}
        </div>
      </section>
      <section className="grid gap-2">
        <h3 className="text-sm font-medium">{t("elements.background")}</h3>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUNDS.map((f) => (
            <m.button
              key={css(f)}
              type="button"
              {...pressable}
              aria-label={t("elements.setBackground", { value: f.type === "solid" ? f.color : t("elements.gradient") })}
              className={tile}
              style={{ background: css(f) }}
              onClick={() => store.run(setBackground(f), "Background")}
            />
          ))}
        </div>
      </section>
      <p className="rounded-2xl border border-dashed p-3 text-sm text-text-2">{t("elements.stickersSoon")}</p>
    </div>
  );
}
