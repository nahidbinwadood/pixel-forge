"use client";

import {
  ADJUSTMENT_RANGES,
  type AdjustmentKey,
  cropForRatio,
  FILTER_PRESETS,
  type ImageNode,
  updateNodes,
} from "@pixelforge/editor-core";
import { cn } from "cn";
import { CrownIcon, FlipHorizontal2Icon, FlipVertical2Icon, RotateCwIcon, Undo2Icon } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { FormSlider } from "@/components/form/form-slider";
import { Button } from "@/components/ui/button";
import { pressable } from "@/lib/motion";
import { useEditor, useEditorStore } from "../store";
import { useActions } from "../use-actions";
import { LiveForm, Section, useLiveForm } from "./live-form";

const AdjustSchema = z.object(
  Object.fromEntries(ADJUSTMENT_RANGES.map((r) => [r.key, z.number().min(r.min).max(r.max)])) as Record<
    AdjustmentKey,
    z.ZodNumber
  >,
);
type AdjustValues = z.infer<typeof AdjustSchema>;

const IntensitySchema = z.object({ intensity: z.number().min(0).max(100) });
type IntensityValues = z.infer<typeof IntensitySchema>;

const RATIOS: ReadonlyArray<{ id: string; ratio: number | null }> = [
  { id: "original", ratio: null },
  { id: "1:1", ratio: 1 },
  { id: "4:5", ratio: 4 / 5 },
  { id: "3:2", ratio: 3 / 2 },
  { id: "16:9", ratio: 16 / 9 },
  { id: "9:16", ratio: 9 / 16 },
];

const chip =
  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none";

/** Source aspect ratio, recovered from the node box and its crop (images are placed unstretched). */
function sourceRatio(node: ImageNode): number {
  const c = node.crop ?? { width: 1, height: 1 };
  return (node.width / node.height) * (c.height / c.width);
}

export function ImageProps({ node }: { node: ImageNode }) {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const a = useActions();
  const premiumOk = useEditor((s) => s.plan.premiumContent);
  const run = (patch: Parameters<typeof updateNodes>[1], label: string, key?: string) =>
    store.run(updateNodes([node.id], patch), label, key);

  const adjustValues = Object.fromEntries(
    ADJUSTMENT_RANGES.map((r) => [r.key, node.adjustments[r.key] ?? 0]),
  ) as AdjustValues;
  const adjustForm = useLiveForm(AdjustSchema, adjustValues, (name, v) =>
    run(
      { adjustments: { ...node.adjustments, [name]: v[name as AdjustmentKey] } },
      t("props.adjust"),
      `${node.id}:${name}`,
    ),
  );
  const intensityForm = useLiveForm(
    IntensitySchema,
    { intensity: Math.round((node.filter?.intensity ?? 1) * 100) },
    (_, v) =>
      node.filter &&
      run({ filter: { ...node.filter, intensity: v.intensity / 100 } }, t("props.filter"), `${node.id}:intensity`),
  );

  const crop = (ratio: number | null) => {
    const src = sourceRatio(node);
    const next = ratio === null ? undefined : cropForRatio({ width: src, height: 1 }, ratio);
    const outRatio = ratio ?? src;
    run({ crop: next, height: Math.max(1, node.width / outRatio) }, t("props.crop"));
  };
  const currentRatio = node.width / node.height;

  return (
    <>
      <Section title={t("props.filters")}>
        <div className="grid grid-cols-3 gap-2">
          <FilterChip
            active={!node.filter}
            label={t("props.none")}
            onClick={() => run({ filter: undefined }, t("props.filter"))}
          />
          {FILTER_PRESETS.map((f) => (
            <FilterChip
              key={f.id}
              active={node.filter?.presetId === f.id}
              label={t(`filters.${f.id}`)}
              premium={f.premium}
              premiumLabel={t("props.premium")}
              onClick={() =>
                run({ filter: { presetId: f.id, intensity: node.filter?.intensity ?? 1 } }, t("props.filter"))
              }
            />
          ))}
        </div>
        {node.filter && (
          <LiveForm form={intensityForm}>
            <FormSlider<IntensityValues> name="intensity" label={t("props.intensity")} format={(v) => `${v}%`} />
          </LiveForm>
        )}
        {!premiumOk && FILTER_PRESETS.some((f) => f.premium && f.id === node.filter?.presetId) && (
          <p className="text-xs text-text-2">{t("props.premiumNote")}</p>
        )}
      </Section>

      <Section title={t("props.adjustments")}>
        <LiveForm form={adjustForm}>
          {ADJUSTMENT_RANGES.map((r) => (
            <FormSlider<AdjustValues> key={r.key} name={r.key} label={t(`adjust.${r.key}`)} min={r.min} max={r.max} />
          ))}
        </LiveForm>
        <Button
          variant="outline"
          size="sm"
          className="justify-self-start"
          disabled={Object.values(node.adjustments).every((v) => !v)}
          onClick={() => run({ adjustments: {} }, t("props.resetAdjust"))}
        >
          <Undo2Icon aria-hidden /> {t("props.resetAdjust")}
        </Button>
      </Section>

      <Section title={t("props.cropRotate")}>
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="sr-only">{t("props.crop")}</legend>
          {RATIOS.map((r) => {
            const active = r.ratio === null ? !node.crop : node.crop && Math.abs(currentRatio - r.ratio) < 0.01;
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={Boolean(active)}
                onClick={() => crop(r.ratio)}
                className={cn(chip, active && "border-primary bg-primary/8 text-primary")}
              >
                {r.id === "original" ? t("props.original") : r.id}
              </button>
            );
          })}
        </fieldset>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => run({ rotation: (((node.rotation + 90) % 360) + 360) % 360 }, t("props.rotate"))}
          >
            <RotateCwIcon aria-hidden /> {t("props.rotate")}
          </Button>
          <Button variant="outline" size="icon-sm" aria-label={t("props.flipH")} onClick={() => a.flip("x")}>
            <FlipHorizontal2Icon aria-hidden />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label={t("props.flipV")} onClick={() => a.flip("y")}>
            <FlipVertical2Icon aria-hidden />
          </Button>
        </div>
      </Section>
    </>
  );
}

function FilterChip({
  active,
  label,
  premium,
  premiumLabel,
  onClick,
}: {
  active: boolean;
  label: string;
  premium?: boolean;
  premiumLabel?: string;
  onClick: () => void;
}) {
  return (
    <m.button
      type="button"
      {...pressable}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "relative flex h-12 items-center justify-center rounded-xl border bg-surface-2 px-2 text-xs font-medium transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
        active && "border-primary bg-primary/8 text-primary",
      )}
    >
      {label}
      {premium && (
        <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-premium text-aurora-ink">
          <CrownIcon className="size-3" aria-hidden />
          <span className="sr-only">{premiumLabel}</span>
        </span>
      )}
    </m.button>
  );
}
