"use client";

import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { duration, ease, spring } from "@/lib/motion";

const KEYS = ["price", "coming", "privacy"] as const;

/** Disclosure list (WAI-ARIA accordion pattern): button + region, height animates open/closed. */
export function Faq() {
  const t = useTranslations("landing.faq");
  const [open, setOpen] = useState<string | null>(KEYS[0]);
  const base = useId();

  return (
    <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12">
      <h2 className="text-h1 lg:col-span-4">{t("title")}</h2>
      <div className="divide-y border-y lg:col-span-8">
        {KEYS.map((key) => {
          const isOpen = open === key;
          const btn = `${base}-${key}-btn`;
          const panel = `${base}-${key}-panel`;
          return (
            <div key={key}>
              <h3>
                <button
                  type="button"
                  id={btn}
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => setOpen(isOpen ? null : key)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-start font-display text-lg font-semibold transition-colors hover:text-primary"
                >
                  {t(`items.${key}.q`)}
                  <m.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={spring.snappy}
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full border transition-colors",
                      isOpen && "border-transparent bg-aurora text-aurora-ink",
                    )}
                    aria-hidden
                  >
                    <PlusIcon className="size-4" />
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
                    <p className="max-w-2xl pb-6 text-text-2">{t(`items.${key}.a`)}</p>
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
