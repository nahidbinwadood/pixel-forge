"use client";

import { cn } from "cn";
import { m, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion";

/** Sticky marketing nav: transparent over the hero, turns into a compact glass bar once you scroll. */
export function SiteNav() {
  const t = useTranslations("landing.nav");
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <div className="sticky top-0 z-50 px-3 pt-3">
      <m.header
        layout
        transition={spring.ui}
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-6 rounded-2xl border px-4 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
          scrolled ? "glass h-14 shadow-float" : "h-16 border-transparent bg-transparent",
        )}
      >
        <Logo />
        <nav aria-label={t("menu")} className="me-auto hidden items-center gap-1 md:flex">
          {(
            [
              ["#tools", t("tools")],
              ["#how", t("how")],
              ["#faq", t("faq")],
            ] as const
          ).map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm text-text-2 transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/sign-in">{t("signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">{t("start")}</Link>
          </Button>
        </div>
      </m.header>
    </div>
  );
}
