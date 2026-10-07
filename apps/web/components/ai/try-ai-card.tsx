"use client";

import { cn } from "cn";
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { liftHover } from "@/lib/motion";

const MLink = m.create(Link);

/** Home's "Try AI" entry point → /ai. */
export function TryAiCard({ className }: { className?: string }) {
  const t = useTranslations("ai.home");
  return (
    <MLink
      href="/ai"
      {...liftHover}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-3xl border bg-surface-2 p-5 surface-highlight outline-none transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/40",
        className,
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-aurora text-aurora-ink shadow-glow">
        <SparklesIcon className="size-5" aria-hidden />
      </span>
      <span className="grid flex-1 gap-0.5">
        <span className="font-display text-lg font-semibold">{t("title")}</span>
        <span className="text-sm text-text-2">{t("body")}</span>
      </span>
      <span className="hidden text-sm font-medium sm:inline">{t("cta")}</span>
      <ArrowUpRightIcon
        className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </MLink>
  );
}
