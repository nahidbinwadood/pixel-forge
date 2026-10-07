"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ASPECT_RATIOS, IMAGE_STYLES, jobCost, textToImageForm, textToImageInput } from "@pixelforge/shared";
import { ImageIcon, SparklesIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { Form } from "@/components/form/form";
import { FormChipGroup } from "@/components/form/form-chip-group";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { fadeIn, listItem, stagger } from "@/lib/motion";
import { GeneratingState } from "./generating-state";
import { HistoryRail } from "./history-rail";
import { JobFailed, PaywallCard, StartError } from "./job-feedback";
import { ResultActions } from "./result-actions";
import { ToolShell } from "./tool-shell";
import type { AIJobView, HistoryItem } from "./types";
import { useAIJob } from "./use-ai-job";

type Values = z.infer<typeof textToImageForm>;

const DEFAULTS: Values = { prompt: "", style: "none", aspectRatio: "1:1", negativePrompt: "", variations: 1 };

export interface ToolProps {
  userId: string;
  ready: boolean;
  credits: { balance: number; allowance: number; refillDate: string };
  history: HistoryItem[];
  nextCursor: string | null;
  title: string;
  backLabel: string;
  meta: ReactNode;
  notice: ReactNode;
}

/** /ai/generate: prompt + style + ratio + variations → polled job → result grid. */
export function GenerateTool(props: ToolProps) {
  const t = useTranslations("ai");
  const tg = useTranslations("ai.generate");
  const [refreshKey, setRefreshKey] = useState(0);
  const form = useForm<Values>({ resolver: zodResolver(textToImageForm), defaultValues: DEFAULTS });
  const variations = useWatch({ control: form.control, name: "variations" });
  const ratio = useWatch({ control: form.control, name: "aspectRatio" });
  const { job, error, run, busy, submitting } = useAIJob({
    userId: props.userId,
    onDone: () => setRefreshKey((k) => k + 1),
  });

  const submit = async (values: Values) => {
    const input = { ...values, negativePrompt: values.negativePrompt?.trim() || undefined };
    const err = await run({ tool: "text_to_image", input });
    if (err?.kind === "blocked") form.setError("prompt", { message: t("errors.blocked") });
  };

  const reuse = async (id: string) => {
    const res = await fetch(`/api/v1/ai/jobs/${id}`);
    if (!res.ok) return;
    const past = (await res.json()) as AIJobView;
    const parsed = textToImageInput.safeParse(past.input);
    if (parsed.success) form.reset({ ...DEFAULTS, ...parsed.data, negativePrompt: parsed.data.negativePrompt ?? "" });
  };

  const cost = jobCost("text_to_image", variations);
  const controls = (
    <Form form={form} onSubmit={submit}>
      <FormTextarea<Values>
        name="prompt"
        label={tg("prompt")}
        placeholder={tg("promptPlaceholder")}
        rows={4}
        maxLength={1000}
        className="font-mono"
      />
      <FormChipGroup<Values>
        name="style"
        label={tg("style")}
        options={IMAGE_STYLES.map((s) => ({ value: s, label: tg(`styles.${s}`) }))}
      />
      <FormChipGroup<Values>
        name="aspectRatio"
        label={tg("ratio")}
        options={ASPECT_RATIOS.map((r) => ({ value: r, label: r }))}
        chipClassName="font-mono"
      />
      <FormChipGroup<Values, number>
        name="variations"
        label={tg("variations")}
        options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
        chipClassName="min-w-10 font-mono"
      />
      <details className="group rounded-xl border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-text-2 outline-none focus-visible:text-foreground">
          {tg("advanced")}
        </summary>
        <FormInput<Values>
          name="negativePrompt"
          label={tg("negative")}
          description={tg("negativeHint")}
          className="mt-3"
        />
      </details>
      <FormRootError />
      <FormSubmit variant="aurora" size="lg" disabled={!props.ready || busy} loading={submitting}>
        <SparklesIcon aria-hidden />
        {tg("submit")}
        <span className="font-mono text-sm opacity-80">· {t("cost", { count: cost })}</span>
      </FormSubmit>
    </Form>
  );

  const aspect = ratio.replace(":", " / ");
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
    result = <GeneratingState status={job?.status ?? "submitting"} tiles={variations} aspect={aspect} />;
  } else if (job && (job.status === "failed" || job.status === "blocked")) {
    result = (
      <JobFailed message={job.error} refunded={job.costCredits} onRetry={() => void form.handleSubmit(submit)()} />
    );
  } else if (job?.status === "succeeded") {
    result = (
      <m.ul
        initial="hidden"
        animate="show"
        variants={stagger(0.08)}
        className={job.assets.length > 1 ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}
      >
        {job.assets.map((a, i) => (
          <m.li
            key={a.id}
            variants={listItem}
            className="grid gap-3 rounded-2xl border bg-surface-2 p-3 surface-highlight"
          >
            {/* biome-ignore lint/performance/noImgElement: presigned URLs, not optimizable by next/image */}
            <img
              src={a.previewUrl ?? a.url}
              alt={`${t("result.variation", { n: i + 1 })}: ${String(job.input.prompt ?? "")}`}
              width={a.width ?? undefined}
              height={a.height ?? undefined}
              className="h-auto w-full rounded-xl bg-surface-3"
            />
            <ResultActions assetId={a.id} url={a.url} filename={`pixelforge-ai-${i + 1}.png`} />
          </m.li>
        ))}
      </m.ul>
    );
  } else {
    result = <EmptyState icon={<ImageIcon />} title={tg("emptyTitle")} description={tg("emptyBody")} />;
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
          {error && error.kind !== "credits" && error.kind !== "blocked" && <StartError error={error} />}
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
          tool="text_to_image"
          initial={props.history}
          initialCursor={props.nextCursor}
          refreshKey={refreshKey}
          onReuse={(id) => void reuse(id)}
        />
      }
    />
  );
}
