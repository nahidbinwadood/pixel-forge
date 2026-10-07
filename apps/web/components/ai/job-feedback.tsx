"use client";

import { CoinsIcon, RotateCcwIcon, ShieldAlertIcon, TriangleAlertIcon } from "lucide-react";
import { m } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scaleIn } from "@/lib/motion";
import type { JobError } from "./use-ai-job";

/** 402 paywall card: balance, cost and the next top-up date. No fake checkout until billing ships. */
export function PaywallCard({
  balance,
  cost,
  allowance,
  refillDate,
}: {
  balance: number;
  cost: number;
  allowance: number;
  refillDate: string;
}) {
  const t = useTranslations("ai.paywall");
  const tc = useTranslations("common");
  const format = useFormatter();
  return (
    <m.div
      initial="hidden"
      animate="show"
      variants={scaleIn}
      role="alert"
      className="grid gap-3 rounded-2xl border bg-surface-2 p-6 surface-highlight"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-surface-3 text-primary">
          <CoinsIcon className="size-5" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-semibold">{t("title")}</h2>
        <Badge variant="premium" className="ms-auto">
          {tc("comingSoon")}
        </Badge>
      </div>
      <p className="text-text-2">
        {t("body", {
          cost: tc("credits", { count: cost }),
          balance: tc("credits", { count: balance }),
          allowance,
          date: format.dateTime(new Date(refillDate), { month: "long", day: "numeric" }),
        })}
      </p>
      <p className="text-sm text-muted-foreground">{t("soon")}</p>
    </m.div>
  );
}

/** Start-time errors (moderation, network). Credits were never charged for these. */
export function StartError({ error }: { error: Exclude<JobError, { kind: "credits" }> }) {
  const t = useTranslations("ai.errors");
  const Icon = error.kind === "blocked" ? ShieldAlertIcon : TriangleAlertIcon;
  return (
    <m.p
      initial="hidden"
      animate="show"
      variants={scaleIn}
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {error.kind === "blocked" ? t("blocked") : error.message || t("generic")}
    </m.p>
  );
}

/** A job that ran and failed or was blocked: message, refund note, retry. */
export function JobFailed({
  message,
  refunded,
  onRetry,
}: {
  message: string | null;
  refunded: number;
  onRetry: () => void;
}) {
  const t = useTranslations("ai.result");
  return (
    <m.div
      initial="hidden"
      animate="show"
      variants={scaleIn}
      role="alert"
      className="grid justify-items-start gap-3 rounded-2xl border border-dashed p-6"
    >
      <h2 className="font-display text-lg font-semibold">{t("failedTitle")}</h2>
      <p className="text-text-2">{message}</p>
      <p className="font-mono text-sm text-muted-foreground">{t("refunded", { count: refunded })}</p>
      <Button variant="secondary" onClick={onRetry}>
        <RotateCcwIcon aria-hidden />
        {t("tryAgain")}
      </Button>
    </m.div>
  );
}
