"use client";

import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { duration, ease, spring } from "@/lib/motion";
import { SectionHeading } from "./section-heading";

const KEYS = ["free", "today", "next", "privacy", "formats"] as const;

/** Two-column FAQ. Accordion (WAI-ARIA disclosure): one open at a time, height animates. */
export function Faq() {
  const t = useTranslations("sections.faq");
  const [open, setOpen] = useState<(typeof KEYS)[number] | null>(KEYS[0]);
  const base = useId();

  return (
    <section
      id="faq"
      aria-labelledby={`${base}-title`}
      className="mx-auto grid max-w-7xl scroll-mt-24 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-32"
    >
      <div className="grid content-start gap-6">
        <SectionHeading id={`${base}-title`} label={t("label")} title={t("title")} />
        <p className="max-w-sm text-text-2">{t("curious")}</p>
      </div>

      <div className="grid gap-3">
        {KEYS.map((key) => {
          const isOpen = open === key;
          const btn = `${base}-${key}-btn`;
          const panel = `${base}-${key}-panel`;
          return (
            <div
              key={key}
              className={cn(
                "rounded-2xl border bg-card transition-[box-shadow,border-color] duration-200",
                isOpen ? "border-primary/30 shadow-card" : "hover:border-foreground/15",
              )}
            >
              <h3 className="font-sans">
                <button
                  type="button"
                  id={btn}
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => setOpen(isOpen ? null : key)}
                  className="flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-4 text-start text-base font-semibold sm:px-6 sm:py-5 sm:text-lg"
                >
                  {t(`items.${key}.q`)}
                  <m.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={spring.snappy}
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full border transition-colors",
                      isOpen && "border-transparent bg-primary-solid text-white",
                    )}
                    aria-hidden
                  >
                    <ChevronDownIcon className="size-4" />
                  </m.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    id={panel}
                    role="region"
                    aria-labelledby={btn}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: duration.panel, ease: ease.out }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-text-2 sm:px-6 sm:pb-6">{t(`items.${key}.a`)}</p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
