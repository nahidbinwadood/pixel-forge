"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuroraBackdrop } from "@/components/brand/aurora-backdrop";
import { LightSweep } from "@/components/brand/light-sweep";
import { Button } from "@/components/ui/button";
import { duration, ease, fadeUp, stagger } from "@/lib/motion";
import { PromptBar } from "./prompt-bar";

const PRESETS = [
  { id: "vivid", label: "Vivid", src: "/hero/lake-vivid.webp" },
  { id: "film", label: "Film", src: "/hero/lake-film.webp" },
  { id: "mono", label: "Mono", src: "/hero/lake-mono.webp" },
] as const;

/**
 * Concept A, "Light Sweep" (AUDIT §4). Text at 5/12, the live before/after at 7/12 on a tilted "editor plate".
 * One orchestrated entrance: copy staggers in, then the canvas settles.
 */
export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative isolate overflow-hidden pt-10 pb-20 sm:pt-16 lg:pt-20 lg:pb-28">
      <AuroraBackdrop />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10">
        <m.div
          className="flex flex-col gap-6 lg:col-span-5"
          initial="hidden"
          animate="show"
          variants={stagger(0.09, 0.05)}
        >
          <m.h1 variants={fadeUp} className="text-hero">
            <span className="block">{t("titleLead")}</span>
            <span className="block text-text-2">{t("titleTail")}</span>
            <span className="block text-aurora">{t("titleKeyword")}</span>
          </m.h1>
          <m.p variants={fadeUp} className="max-w-md text-lg text-text-2">
            {t("subtitle")}
          </m.p>
          <m.div variants={fadeUp} className="flex flex-col gap-3">
            <PromptBar />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button asChild size="lg">
                <Link href="/sign-up">{t("cta")}</Link>
              </Button>
              <span className="text-sm text-muted-foreground">{t("note")}</span>
            </div>
          </m.div>
        </m.div>

        <m.div
          className="relative lg:col-span-7"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: duration.page + 0.2, ease: ease.out, delay: 0.25 }}
        >
          {/* The tilted "editor plate" sits behind the straight, draggable canvas. */}
          <div
            aria-hidden
            className="absolute -inset-3 hidden rotate-[-2.5deg] rounded-[2rem] border bg-surface-1/70 shadow-float backdrop-blur sm:block"
          >
            <div className="flex gap-1.5 p-3">
              <span className="size-2.5 rounded-full bg-surface-3" />
              <span className="size-2.5 rounded-full bg-surface-3" />
              <span className="size-2.5 rounded-full bg-surface-3" />
            </div>
          </div>
          <div className="relative">
            <LightSweep original="/hero/lake-original.webp" presets={PRESETS} alt={t("sweepAlt")} priority />
            <p className="mt-3 text-sm text-muted-foreground">{t("sweepHint")}</p>
          </div>
        </m.div>
      </div>
    </section>
  );
}
