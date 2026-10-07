"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { bgRemoveInput, jobCost } from "@pixelforge/shared";
import { ScissorsIcon, WandSparklesIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { UploadDropzone } from "@/app/(app)/uploads/upload-dropzone";
import { Form } from "@/components/form/form";
import { FormChipGroup } from "@/components/form/form-chip-group";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { EmptyState } from "@/components/shared/empty-state";
import { fadeIn } from "@/lib/motion";
import { CompareSweep } from "./compare-sweep";
import type { ToolProps } from "./generate-tool";
import { GeneratingState } from "./generating-state";
import { HistoryRail } from "./history-rail";
import { JobFailed, PaywallCard, StartError } from "./job-feedback";
import { ResultActions } from "./result-actions";
import { ToolShell } from "./tool-shell";
import { useAIJob } from "./use-ai-job";
import { type PickableImage, usePickableUploads } from "./use-pickable-uploads";

type Values = z.infer<typeof bgRemoveInput>;

/** /ai/remove-background: pick or upload a photo → cut-out with before/after sweep. */
export function RemoveBgTool(props: ToolProps & { uploads: PickableImage[]; maxMb: number; initialAssetId?: string }) {
  const t = useTranslations("ai");
  const tr = useTranslations("ai.removeBg");
  const [refreshKey, setRefreshKey] = useState(0);
  const form = useForm<Values>({
    resolver: zodResolver(bgRemoveInput),
    defaultValues: { assetId: props.initialAssetId ?? props.uploads[0]?.id ?? "" },
  });
  const picked = useWatch({ control: form.control, name: "assetId" });
  const picker = usePickableUploads({
    initial: props.uploads,
    maxMb: props.maxMb,
    userId: props.userId,
    onReady: (id) => form.setValue("assetId", id, { shouldValidate: true }),
  });
  const { job, error, run, busy, submitting } = useAIJob({
    userId: props.userId,
    onDone: () => setRefreshKey((k) => k + 1),
  });

  const submit = async (values: Values) => {
    await run({ tool: "bg_remove", input: values });
  };

  const controls = (
    <Form form={form} onSubmit={submit}>
      {picker.items.length > 0 ? (
        <FormChipGroup<Values>
          name="assetId"
          label={tr("pick")}
          description={tr("pickHint")}
          listClassName="grid grid-cols-4 gap-2"
          chipClassName="aspect-square overflow-hidden rounded-xl border-2 p-0 aria-checked:border-primary"
          options={picker.items.map((u) => ({
            value: u.id,
            label: u.name || tr("pick"),
            content: u.thumbUrl ? (
              // biome-ignore lint/performance/noImgElement: presigned URLs, not optimizable by next/image
              <img src={u.thumbUrl} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <span className="block size-full bg-surface-3" />
            ),
          }))}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{tr("noUploads")}</p>
      )}
      <UploadDropzone
        compact
        onFiles={(files) => void picker.add(files)}
        uploading={picker.busy ? Math.max(1, picker.uploading) : 0}
        maxMb={props.maxMb}
        title={tr("uploadNew")}
      />
      <FormRootError />
      <FormSubmit variant="aurora" size="lg" disabled={!props.ready || busy || !picked}>
        <WandSparklesIcon aria-hidden />
        {tr("submit")}
        <span className="font-mono text-sm opacity-80">· {t("cost", { count: jobCost("bg_remove") })}</span>
      </FormSubmit>
    </Form>
  );

  const output = job?.status === "succeeded" ? job.assets[0] : undefined;
  let result: ReactNode;
  if (error?.kind === "credits") {
    result = (
      <PaywallCard
        balance={error.balance}
        cost={error.cost}
        allowance={props.credits.allowance}
        refillDate={props.credits.refillDate}
      />
    );
  } else if (submitting || (job && (job.status === "queued" || job.status === "running"))) {
    result = <GeneratingState status={job?.status ?? "submitting"} aspect="4 / 3" />;
  } else if (job && (job.status === "failed" || job.status === "blocked")) {
    result = (
      <JobFailed message={job.error} refunded={job.costCredits} onRetry={() => void form.handleSubmit(submit)()} />
    );
  } else if (output && job?.source) {
    result = (
      <div className="grid gap-3">
        <CompareSweep
          before={job.source.previewUrl ?? job.source.url}
          after={output.url}
          labels={{ before: tr("original"), after: tr("result"), slider: tr("compare") }}
        />
        <ResultActions assetId={output.id} url={output.url} filename="pixelforge-cutout.png" />
      </div>
    );
  } else {
    result = <EmptyState icon={<ScissorsIcon />} title={tr("emptyTitle")} description={tr("emptyBody")} />;
  }

  return (
    <ToolShell
      title={props.title}
      backLabel={props.backLabel}
      meta={props.meta}
      notice={props.notice}
      controls={controls}
      result={
        <div className="grid gap-4">
          {error && error.kind !== "credits" && <StartError error={error} />}
          <AnimatePresence mode="wait">
            <m.div
              key={job?.status ?? error?.kind ?? "empty"}
              variants={fadeIn}
              initial="hidden"
              animate="show"
              exit="hidden"
            >
              {result}
            </m.div>
          </AnimatePresence>
        </div>
      }
      history={
        <HistoryRail
          tool="bg_remove"
          initial={props.history}
          initialCursor={props.nextCursor}
          refreshKey={refreshKey}
        />
      }
    />
  );
}
