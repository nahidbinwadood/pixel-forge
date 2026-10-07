"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EXPORT_FORMATS, exportFileName, exportSize, formatBytes, premiumFiltersUsed } from "@pixelforge/editor-core";
import { CrownIcon, DownloadIcon, Loader2Icon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormChoiceCards } from "@/components/form/form-choice-cards";
import { FormSelect } from "@/components/form/form-select";
import { FormSlider } from "@/components/form/form-slider";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { track } from "@/lib/analytics";
import { duration, ease } from "@/lib/motion";
import { downloadBlob, renderExport } from "./render-export";
import { useEditor, useEditorStore } from "./store";

const ExportForm = z.object({
  format: z.enum(EXPORT_FORMATS),
  scale: z.enum(["1", "2", "3"]),
  quality: z.number().min(10).max(100),
});
type ExportValues = z.infer<typeof ExportForm>;

const ESTIMATE_DELAY = 400;

/** Export (PRD E5): format, size within the plan limit, watermark notice, live file-size estimate. */
export function ExportDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}) {
  const t = useTranslations("editor");
  const tp = useTranslations("paywall");
  const store = useEditorStore();
  const plan = useEditor((s) => s.plan);
  const doc = useEditor((s) => s.history.doc);
  const page = doc.pages[0];
  const form = useForm<ExportValues>({
    resolver: zodResolver(ExportForm),
    defaultValues: { format: "png", scale: "1", quality: 90 },
  });
  const values = useWatch({ control: form.control });
  const [estimate, setEstimate] = useState<number | null>(null);

  const blocked = plan.premiumContent ? [] : premiumFiltersUsed(doc);
  const size = page ? exportSize(page, Number(values.scale ?? 1), plan.maxExportPx) : null;
  const lossy = values.format === "jpg" || values.format === "webp";

  // Live size estimate: encode in the background after the options settle.
  useEffect(() => {
    if (!open) return;
    setEstimate(null);
    const timer = setTimeout(async () => {
      try {
        const blob = await renderExport(store, plan, {
          format: values.format ?? "png",
          scale: Number(values.scale ?? 1),
          quality: (values.quality ?? 90) / 100,
        });
        setEstimate(blob.size);
      } catch {
        setEstimate(null);
      }
    }, ESTIMATE_DELAY);
    return () => clearTimeout(timer);
  }, [open, store, plan, values.format, values.scale, values.quality]);

  const submit = async (v: ExportValues) => {
    if (blocked.length) return;
    try {
      const blob = await renderExport(store, plan, {
        format: v.format,
        scale: Number(v.scale),
        quality: v.quality / 100,
      });
      downloadBlob(blob, exportFileName(store.get().name, v.format));
      track(
        "export_completed",
        { format: v.format, width: size?.width, height: size?.height, bytes: blob.size, watermark: plan.watermark },
        userId,
      );
      onOpenChange(false);
    } catch (e) {
      console.error("export failed", e);
      form.setError("root", { message: t("exportDialog.failed") });
      toast.error(t("exportDialog.failed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("exportDialog.title")}</DialogTitle>
          <DialogDescription>{t("exportDialog.description")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={submit} className="gap-4">
          <FormChoiceCards<ExportValues>
            name="format"
            label={t("exportDialog.format")}
            columns="grid-cols-4"
            options={EXPORT_FORMATS.map((f) => ({
              value: f,
              label: f.toUpperCase(),
              hint: t(`exportDialog.hint.${f}`),
            }))}
          />
          <FormSelect<ExportValues>
            name="scale"
            label={t("exportDialog.size")}
            options={(["1", "2", "3"] as const).map((s) => {
              const o = page ? exportSize(page, Number(s), plan.maxExportPx) : null;
              return { value: s, label: o ? `${s}× · ${o.width} × ${o.height} px` : `${s}×` };
            })}
            description={size?.capped ? t("exportDialog.capped", { max: plan.maxExportPx }) : undefined}
          />
          <AnimatePresence initial={false}>
            {lossy && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.micro, ease: ease.out }}
              >
                <FormSlider<ExportValues>
                  name="quality"
                  label={t("exportDialog.quality")}
                  min={10}
                  max={100}
                  format={(v) => `${v}%`}
                />
              </m.div>
            )}
          </AnimatePresence>

          <dl className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-sm">
            <dt className="text-text-2">{t("exportDialog.estimate")}</dt>
            <dd className="font-mono tabular-nums" data-testid="export-estimate" aria-live="polite">
              {estimate === null ? (
                <Loader2Icon className="size-4 animate-spin" aria-label={t("exportDialog.estimating")} />
              ) : (
                formatBytes(estimate)
              )}
            </dd>
          </dl>

          {plan.watermark && <p className="text-sm text-text-2">{t("exportDialog.watermark")}</p>}
          {blocked.length > 0 && (
            <div role="alert" className="flex gap-3 rounded-2xl border bg-surface-2 p-3 text-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-premium text-aurora-ink">
                <CrownIcon className="size-3.5" aria-hidden />
              </span>
              <p>
                <span className="font-medium">{tp("title")}.</span> {t("exportDialog.premiumBlocked")} {tp("body")}
              </p>
            </div>
          )}

          <FormRootError />
          <FormSubmit disabled={blocked.length > 0} data-testid="export-download">
            <DownloadIcon aria-hidden />{" "}
            {t("exportDialog.download", { format: (values.format ?? "png").toUpperCase() })}
          </FormSubmit>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
