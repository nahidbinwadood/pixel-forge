"use client";

import { type ShapeNode, updateNodes } from "@pixelforge/editor-core";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { FormColor } from "@/components/form/form-color";
import { FormSlider } from "@/components/form/form-slider";
import { FormSwitch } from "@/components/form/form-switch";
import { useEditorStore } from "../store";
import { LiveForm, Section, useLiveForm } from "./live-form";

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const Schema = z.object({
  hasFill: z.boolean(),
  fill: hex,
  hasStroke: z.boolean(),
  stroke: hex,
  strokeWidth: z.number().min(0).max(200),
  cornerRadius: z.number().min(0).max(2000),
});
type Values = z.infer<typeof Schema>;

const FALLBACK = "#5b3fe0";

export function ShapeProps({ node }: { node: ShapeNode }) {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const fillColor = node.fill?.type === "solid" ? node.fill.color : (node.fill?.stops[0]?.color ?? FALLBACK);
  const values: Values = {
    hasFill: node.fill !== undefined,
    fill: fillColor.slice(0, 7),
    hasStroke: node.stroke !== undefined,
    stroke: (node.stroke?.color ?? "#10112a").slice(0, 7),
    strokeWidth: node.stroke?.width ?? 0,
    cornerRadius: node.cornerRadius,
  };
  const form = useLiveForm(Schema, values, (name, v) => {
    const patch =
      name === "fill" || name === "hasFill"
        ? { fill: v.hasFill ? { type: "solid" as const, color: v.fill } : undefined }
        : name === "cornerRadius"
          ? { cornerRadius: v.cornerRadius }
          : {
              stroke: v.hasStroke
                ? { color: v.stroke, width: v.strokeWidth || Math.max(2, Math.round(node.width * 0.02)) }
                : undefined,
            };
    store.run(updateNodes([node.id], patch), t("props.editShape"), `${node.id}:${name}`);
  });
  const hasFill = form.watch("hasFill");
  const hasStroke = form.watch("hasStroke");
  const isLine = node.shape === "line";

  return (
    <LiveForm form={form}>
      <Section title={t("props.shape")}>
        {!isLine && <FormSwitch<Values> name="hasFill" label={t("props.fill")} />}
        {!isLine && hasFill && <FormColor<Values> name="fill" label={t("props.fillColor")} hideLabel />}
        <FormSwitch<Values> name="hasStroke" label={t("props.stroke")} />
        {hasStroke && (
          <>
            <FormColor<Values> name="stroke" label={t("props.strokeColor")} hideLabel />
            <FormSlider<Values> name="strokeWidth" label={t("props.strokeWidth")} min={0} max={100} />
          </>
        )}
        {node.shape === "rect" && (
          <FormSlider<Values>
            name="cornerRadius"
            label={t("props.cornerRadius")}
            min={0}
            max={Math.round(Math.min(node.width, node.height) / 2)}
          />
        )}
      </Section>
    </LiveForm>
  );
}
