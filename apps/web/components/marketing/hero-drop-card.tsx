"use client";

import { cn } from "cn";
import { ArrowRightIcon, ImagePlusIcon, SparklesIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type DragEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion";

/**
 * Hero drop card. Honest by design: nothing is processed here. Editing needs an account, so both the
 * buttons and a dropped file take you to sign-up. The buttons are the keyboard path; drop is a shortcut.
 */
export function HeroDropCard() {
  const t = useTranslations("landing.hero");
  const router = useRouter();
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    router.push("/sign-up");
  };

  return (
    <m.div
      whileHover={{ y: -2 }}
      transition={spring.ui}
      className="relative w-full max-w-2xl rounded-[1.75rem] border bg-surface-1 p-2.5 shadow-float"
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drop target; the buttons inside are the keyboard path */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative isolate flex flex-col items-center gap-4 overflow-hidden rounded-[1.35rem] border border-dashed px-6 py-10 text-center transition-colors sm:py-12",
          dragging ? "border-primary" : "border-border",
        )}
      >
        <AnimatePresence>
          {dragging && (
            <m.div
              aria-hidden
              className="absolute inset-0 -z-10 bg-aurora opacity-15"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        <m.span
          animate={dragging ? { scale: 1.12, rotate: -6 } : { scale: 1, rotate: 0 }}
          transition={spring.snappy}
          className="grid size-14 place-items-center rounded-2xl border bg-background text-primary shadow-card"
          aria-hidden
        >
          <ImagePlusIcon className="size-6" />
        </m.span>

        <div className="grid gap-1.5">
          <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {dragging ? t("dropActive") : t("dropTitle")}
          </p>
          <p className="text-sm text-text-2">{t("dropBody")}</p>
        </div>

        <div className="mt-2 flex flex-col items-center gap-2.5 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/sign-up">
              {t("choose")}
              <ArrowRightIcon aria-hidden className="transition-transform group-hover/button:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/sign-up">
              <SparklesIcon aria-hidden className="text-primary" />
              {t("describe")}
            </Link>
          </Button>
        </div>
      </div>
    </m.div>
  );
}
