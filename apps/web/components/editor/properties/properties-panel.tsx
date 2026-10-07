"use client";

import { getNode, type Node, ratioLabel, setBackground, updateNodes } from "@pixelforge/editor-core";
import {
  AlignCenterHorizontalIcon,
  AlignCenterVerticalIcon,
  AlignEndHorizontalIcon,
  AlignEndVerticalIcon,
  AlignHorizontalSpaceAroundIcon,
  AlignStartHorizontalIcon,
  AlignStartVerticalIcon,
  AlignVerticalSpaceAroundIcon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { FormColor } from "@/components/form/form-color";
import { FormSelect } from "@/components/form/form-select";
import { FormSlider } from "@/components/form/form-slider";
import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { useEditor, useEditorStore, usePage } from "../store";
import { useActions } from "../use-actions";
import { ImageProps } from "./image-props";
import { LiveForm, Section, useLiveForm } from "./live-form";
import { ShapeProps } from "./shape-props";
import { TextProps } from "./text-props";

/** Context-aware right panel: page settings, one object's properties, or multi-select arrange tools. */
export function PropertiesPanel() {
  const t = useTranslations("editor");
  const page = usePage();
  const selection = useEditor((s) => s.selection);
  const nodes = selection.flatMap((id) => {
    const n = getNode(page, id);
    return n && n.type !== "group" ? [n] : [];
  });
  const only = nodes.length === 1 ? nodes[0] : undefined;
  const key = only ? only.id : nodes.length > 1 ? "multi" : "page";

  return (
    <aside
      aria-label={t("props.label")}
      className="hidden w-76 shrink-0 overflow-y-auto border-s bg-surface-1 lg:block"
      data-testid="properties-panel"
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.micro, ease: ease.out }}
        >
          {only ? (
            <>
              {only.type === "text" && <TextProps node={only} />}
              {only.type === "shape" && <ShapeProps node={only} />}
              {only.type === "image" && <ImageProps node={only} />}
              <LayerProps nodes={[only]} />
            </>
          ) : nodes.length > 1 ? (
            <>
              <ArrangeSection count={nodes.length} />
              <LayerProps nodes={nodes} />
            </>
          ) : (
            <PageProps />
          )}
        </m.div>
      </AnimatePresence>
    </aside>
  );
}

const LayerSchema = z.object({
  opacity: z.number().min(0).max(100),
  rotation: z.number().min(-180).max(180),
  blendMode: z.enum(["normal", "multiply", "screen", "overlay"]),
});
type LayerValues = z.infer<typeof LayerSchema>;

const normRotation = (r: number) => {
  const x = ((r % 360) + 360) % 360;
  return Math.round(x > 180 ? x - 360 : x);
};

function LayerProps({ nodes }: { nodes: Node[] }) {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const first = nodes[0];
  const ids = nodes.map((n) => n.id);
  const form = useLiveForm(
    LayerSchema,
    {
      opacity: Math.round((first?.opacity ?? 1) * 100),
      rotation: normRotation(first?.rotation ?? 0),
      blendMode: first?.blendMode ?? "normal",
    },
    (name, v) => {
      const patch =
        name === "opacity"
          ? { opacity: v.opacity / 100 }
          : name === "rotation"
            ? { rotation: v.rotation }
            : { blendMode: v.blendMode };
      store.run(updateNodes(ids, patch), t("props.layer"), `${ids.join(",")}:${name}`);
    },
  );
  return (
    <LiveForm form={form}>
      <Section title={t("props.layer")}>
        <FormSlider<LayerValues> name="opacity" label={t("props.opacity")} format={(v) => `${v}%`} />
        <FormSlider<LayerValues>
          name="rotation"
          label={t("props.rotation")}
          min={-180}
          max={180}
          format={(v) => `${v}°`}
        />
        <FormSelect<LayerValues>
          name="blendMode"
          label={t("props.blend")}
          options={(["normal", "multiply", "screen", "overlay"] as const).map((b) => ({
            value: b,
            label: t(`props.blendModes.${b}`),
          }))}
        />
      </Section>
    </LiveForm>
  );
}

function ArrangeSection({ count }: { count: number }) {
  const t = useTranslations("editor");
  const a = useActions();
  const items = [
    { id: "left", icon: AlignStartVerticalIcon, run: () => a.align("left") },
    { id: "center", icon: AlignCenterVerticalIcon, run: () => a.align("center") },
    { id: "right", icon: AlignEndVerticalIcon, run: () => a.align("right") },
    { id: "top", icon: AlignStartHorizontalIcon, run: () => a.align("top") },
    { id: "middle", icon: AlignCenterHorizontalIcon, run: () => a.align("middle") },
    { id: "bottom", icon: AlignEndHorizontalIcon, run: () => a.align("bottom") },
  ] as const;
  return (
    <Section title={t("props.arrange", { count })}>
      <div className="grid grid-cols-6 gap-1">
        {items.map(({ id, icon: Icon, run }) => (
          <Button key={id} variant="outline" size="icon-sm" aria-label={t(`align.${id}`)} onClick={run}>
            <Icon aria-hidden />
          </Button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" disabled={count < 3} onClick={() => a.distribute("horizontal")}>
          <AlignHorizontalSpaceAroundIcon aria-hidden /> {t("align.distributeH")}
        </Button>
        <Button variant="outline" size="sm" disabled={count < 3} onClick={() => a.distribute("vertical")}>
          <AlignVerticalSpaceAroundIcon aria-hidden /> {t("align.distributeV")}
        </Button>
      </div>
      <Button variant="secondary" size="sm" className="justify-self-start" onClick={a.group}>
        {t("shortcut.group")}
      </Button>
    </Section>
  );
}

const PageSchema = z.object({ color: z.string().regex(/^#[0-9a-f]{6}$/i) });
type PageValues = z.infer<typeof PageSchema>;

function PageProps() {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const page = usePage();
  const bg = page.background;
  const color = bg.type === "solid" ? bg.color : bg.type === "linear" ? (bg.stops[0]?.color ?? "#ffffff") : "#ffffff";
  const form = useLiveForm(PageSchema, { color: color.slice(0, 7) }, (_, v) =>
    store.run(setBackground({ type: "solid", color: v.color }), t("props.background"), "page:bg"),
  );
  return (
    <LiveForm form={form}>
      <Section title={t("props.page")}>
        <p className="font-mono text-sm text-text-2 tabular-nums">
          {page.width} × {page.height} px · {ratioLabel(page.width, page.height)}
        </p>
        <FormColor<PageValues> name="color" label={t("props.background")} />
        <p className="text-sm text-text-2">{t("props.pageHint")}</p>
      </Section>
    </LiveForm>
  );
}
