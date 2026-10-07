"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { jobCost, WRITE_KINDS, WRITE_TONES, writeForm, writeInput } from "@pixelforge/shared";
import { CheckIcon, CopyIcon, PenLineIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Form } from "@/components/form/form";
import { FormChipGroup } from "@/components/form/form-chip-group";
import { FormSelect } from "@/components/form/form-select";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { fadeIn, listItem, stagger } from "@/lib/motion";
import type { ToolProps } from "./generate-tool";
import { GeneratingState } from "./generating-state";
import { HistoryRail } from "./history-rail";
import { JobFailed, PaywallCard, StartError } from "./job-feedback";
import { ToolShell } from "./tool-shell";
import type { AIJobView } from "./types";
import { useAIJob } from "./use-ai-job";

type Values = z.infer<typeof writeForm>;
const DEFAULTS: Values = { kind: "caption", topic: "", tone: "friendly", count: 3 };

function CopyButton({ text }: { text: string }) {
  const t = useTranslations("ai.write");
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t("copy")}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        toast.success(t("copied"));
        setTimeout(() => setDone(false), 1_500);
      }}
    >
      {done ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
    </Button>
  );
}

/** /ai/write: captions, hashtags, ad copy. */
export function WriteTool(props: ToolProps) {
  const t = useTranslations("ai");
  const tw = useTranslations("ai.write");
  const [refreshKey, setRefreshKey] = useState(0);
  const form = useForm<Values>({ resolver: zodResolver(writeForm), defaultValues: DEFAULTS });
  const { job, error, run, busy, submitting } = useAIJob({
    userId: props.userId,
    onDone: () => setRefreshKey((k) => k + 1),
  });

  const submit = async (values: Values) => {
    const err = await run({ tool: "write", input: values });
    if (err?.kind === "blocked") form.setError("topic", { message: t("errors.blocked") });
  };

  const reuse = async (id: string) => {
    const res = await fetch(`/api/v1/ai/jobs/${id}`);
    if (!res.ok) return;
    const parsed = writeInput.safeParse(((await res.json()) as AIJobView).input);
    if (parsed.success) form.reset(parsed.data);
  };

  const controls = (
    <Form form={form} onSubmit={submit}>
      <FormChipGroup<Values>
        name="kind"
        label={tw("kind")}
        options={WRITE_KINDS.map((k) => ({ value: k, label: tw(`kinds.${k}`) }))}
      />
      <FormTextarea<Values>
        name="topic"
        label={tw("topic")}
        placeholder={tw("topicPlaceholder")}
        rows={4}
        maxLength={500}
      />
      <FormSelect<Values>
        name="tone"
        label={tw("tone")}
        options={WRITE_TONES.map((v) => ({ value: v, label: tw(`tones.${v}`) }))}
      />
      <FormChipGroup<Values, number>
        name="count"
        label={tw("count")}
        options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
        chipClassName="min-w-10 font-mono"
      />
      <FormRootError />
      <FormSubmit variant="aurora" size="lg" disabled={!props.ready || busy} loading={submitting}>
        <PenLineIcon aria-hidden />
        {tw("submit")}
        <span className="font-mono text-sm opacity-80">· {t("cost", { count: jobCost("write") })}</span>
      </FormSubmit>
    </Form>
  );

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
    result = <GeneratingState status={job?.status ?? "submitting"} aspect="16 / 5" />;
  } else if (job && (job.status === "failed" || job.status === "blocked")) {
    result = (
      <JobFailed message={job.error} refunded={job.costCredits} onRetry={() => void form.handleSubmit(submit)()} />
    );
  } else if (job?.status === "succeeded") {
    result = (
      <m.ul initial="hidden" animate="show" variants={stagger(0.06)} className="grid gap-3">
        {job.texts.map((text, i) => (
          <m.li
            // biome-ignore lint/suspicious/noArrayIndexKey: generated texts are immutable for this job
            key={i}
            variants={listItem}
            className="flex items-start gap-3 rounded-2xl border bg-surface-2 p-4 surface-highlight"
          >
            <p className="flex-1 whitespace-pre-wrap">{text}</p>
            <CopyButton text={text} />
          </m.li>
        ))}
      </m.ul>
    );
  } else {
    result = <EmptyState icon={<PenLineIcon />} title={tw("emptyTitle")} description={tw("emptyBody")} />;
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
          tool="write"
          initial={props.history}
          initialCursor={props.nextCursor}
          refreshKey={refreshKey}
          onReuse={(id) => void reuse(id)}
        />
      }
    />
  );
}
