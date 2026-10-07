"use client";

import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { ease, fadeUp, stagger } from "@/lib/motion";

const STEPS = ["upload", "edit", "export"] as const;

/** A real three-step sequence, so numbering is meaningful. A light line draws across as it enters view. */
export function HowItWorks() {
  const t = useTranslations("landing.how");
  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
      <h2 className="mb-12 max-w-xl text-h1">{t("title")}</h2>
      <div className="relative">
        <m.div
          aria-hidden
          className="absolute top-6 right-[16%] left-[16%] hidden h-px origin-left bg-aurora md:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 1.1, ease: ease.out, delay: 0.2 }}
        />
        <m.ol
          className="grid gap-10 md:grid-cols-3 md:gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={stagger(0.15)}
        >
          {STEPS.map((key, i) => (
            <m.li key={key} variants={fadeUp} className="relative flex flex-col gap-4 md:items-center md:text-center">
              <span className="relative z-10 grid size-12 place-items-center rounded-full border bg-background font-mono text-sm font-medium text-primary shadow-card">
                {i + 1}
              </span>
              <div className="grid gap-1.5 md:max-w-xs">
                <h3 className="font-display text-xl font-semibold">{t(`steps.${key}`)}</h3>
                <p className="text-text-2">{t(`steps.${key}Desc`)}</p>
              </div>
            </m.li>
          ))}
        </m.ol>
      </div>
    </section>
  );
}
