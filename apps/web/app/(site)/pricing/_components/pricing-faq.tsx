"use client";

import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { duration, ease, spring } from "@/lib/motion";

const KEYS = ["cancel", "credits", "rollover", "switch"] as const;

/** Same disclosure pattern as components/marketing/faq.tsx, scoped to billing questions. */
export function PricingFaq() {
  const t = useTranslations("billing.pricing.faq");
  const [open, setOpen] = useState<(typeof KEYS)[number] | null>(KEYS[0]);
  const base = useId();

  return (
    <section aria-labelledby={`${base}-title`} className="mx-auto max-w-2xl">
      <h2 id={`${base}-title`} className="text-h1 text-center">
        {t("title")}
      </h2>
      <div className="mt-8 grid gap-3">
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
                  className="flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-4 text-start font-semibold"
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
                    <p className="px-5 pb-5 text-text-2">{t(`items.${key}.a`)}</p>
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
