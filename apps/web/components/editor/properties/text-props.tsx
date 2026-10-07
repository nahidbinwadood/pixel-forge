"use client";

import { type TextNode, updateNodes } from "@pixelforge/editor-core";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { FormColor } from "@/components/form/form-color";
import { FormRadioGroup } from "@/components/form/form-radio-group";
import { FormSelect } from "@/components/form/form-select";
import { FormSlider } from "@/components/form/form-slider";
import { FormTextarea } from "@/components/form/form-textarea";
import { FONT_OPTIONS } from "../fonts";
import { useEditorStore } from "../store";
import { LiveForm, Section, useLiveForm } from "./live-form";

const Schema = z.object({
  text: z.string().max(10_000),
  fontFamily: z.string().min(1),
  fontWeight: z.string().regex(/^[1-9]00$/),
  fontSize: z.number().min(4).max(800),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  align: z.enum(["left", "center", "right"]),
  letterSpacing: z.number().min(-20).max(100),
  lineHeight: z.number().min(0.6).max(3),
});
type Values = z.infer<typeof Schema>;

const WEIGHTS = ["300", "400", "500", "600", "700", "800"] as const;

const firstColor = (n: TextNode) => (n.fill.type === "solid" ? n.fill.color : (n.fill.stops[0]?.color ?? "#000000"));

export function TextProps({ node }: { node: TextNode }) {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const values: Values = {
    text: node.text,
    fontFamily: node.fontFamily,
    fontWeight: String(node.fontWeight),
    fontSize: Math.round(node.fontSize),
    color: firstColor(node).slice(0, 7),
    align: node.align,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
  };
  const form = useLiveForm(Schema, values, (name, v) => {
    const patch =
      name === "color"
        ? { fill: { type: "solid" as const, color: v.color } }
        : name === "fontWeight"
          ? { fontWeight: Number(v.fontWeight) }
          : { [name]: v[name as keyof Values] };
    store.run(updateNodes([node.id], patch), t("props.editText"), `${node.id}:${name}`);
  });

  return (
    <LiveForm form={form}>
      <Section title={t("props.text")}>
        <FormTextarea<Values> name="text" label={t("props.content")} rows={3} />
        <FormSelect<Values>
          name="fontFamily"
          label={t("props.font")}
          options={FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormSelect<Values>
            name="fontWeight"
            label={t("props.weight")}
            options={WEIGHTS.map((w) => ({ value: w, label: t(`props.weights.${w}`) }))}
          />
          <FormRadioGroup<Values>
            name="align"
            label={t("props.align")}
            orientation="horizontal"
            options={[
              { value: "left", label: t("props.alignLeft") },
              { value: "center", label: t("props.alignCenter") },
              { value: "right", label: t("props.alignRight") },
            ]}
          />
        </div>
        <FormSlider<Values> name="fontSize" label={t("props.size")} min={4} max={400} />
        <FormColor<Values> name="color" label={t("props.color")} />
        <FormSlider<Values> name="letterSpacing" label={t("props.letterSpacing")} min={-20} max={100} />
        <FormSlider<Values>
          name="lineHeight"
          label={t("props.lineHeight")}
          min={0.6}
          max={3}
          step={0.05}
          format={(v) => v.toFixed(2)}
        />
      </Section>
    </LiveForm>
  );
}
