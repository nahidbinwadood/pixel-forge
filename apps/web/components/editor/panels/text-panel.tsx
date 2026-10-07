"use client";

import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { pressable } from "@/lib/motion";
import { type TextPreset, textNode } from "../factories";
import { useEditorStore } from "../store";
import { useActions } from "../use-actions";

const PRESETS: ReadonlyArray<{ id: TextPreset; className: string }> = [
  { id: "heading", className: "font-display text-2xl font-bold tracking-tight" },
  { id: "subheading", className: "font-display text-lg font-semibold" },
  { id: "body", className: "text-sm" },
];

export function TextPanel() {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const a = useActions();
  return (
    <div className="grid gap-2">
      <p className="text-sm text-text-2">{t("text.hint")}</p>
      {PRESETS.map((p) => (
        <m.button
          key={p.id}
          type="button"
          {...pressable}
          data-testid={`add-text-${p.id}`}
          onClick={() => a.add(textNode(store.page(), p.id, t(`text.${p.id}Default`)))}
          className="rounded-2xl border bg-surface-2 px-4 py-3 text-start transition-colors hover:border-primary/40 hover:bg-surface-3 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <span className={p.className}>{t(`text.${p.id}`)}</span>
        </m.button>
      ))}
    </div>
  );
}
