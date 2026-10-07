"use client";

import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import { m, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { duration, ease, spring } from "@/lib/motion";
import { ThemeToggle } from "./hero-theme-toggle";

const LINKS = [
  ["#tools", "tools"],
  ["#looks", "looks"],
  ["#how", "how"],
  ["#faq", "faq"],
] as const;

/**
 * Sticky marketing nav. Logo left, a centered pill-group of section anchors, actions right.
 * Transparent over the hero; once scrolled it becomes a glass bar with a hairline. Mobile: Sheet menu.
 */
export function SiteNav() {
  const t = useTranslations("landing.nav");
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <m.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.page, ease: ease.out }}
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-border bg-background/75 backdrop-blur-xl backdrop-saturate-150" : "border-transparent",
      )}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
        <Logo />

        <nav aria-label={t("menu")} className="hidden lg:block">
          <ul
            className="flex items-center gap-0.5 rounded-full border bg-surface-1/70 p-1 shadow-card backdrop-blur"
            onMouseLeave={() => setHovered(null)}
          >
            {LINKS.map(([href, key]) => (
              <li key={href} className="relative">
                {hovered === href && (
                  <m.span
                    layoutId="site-nav-hover"
                    className="absolute inset-0 rounded-full bg-secondary"
                    transition={spring.ui}
                    aria-hidden
                  />
                )}
                <a
                  href={href}
                  onMouseEnter={() => setHovered(href)}
                  onFocus={() => setHovered(href)}
                  className="relative block rounded-full px-4 py-1.5 text-sm font-medium text-text-2 transition-colors hover:text-foreground"
                >
                  {t(key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-2">
          <ThemeToggle label={t("theme")} className="hidden sm:grid" />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/sign-in">{t("signIn")}</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/sign-up">{t("start")}</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </m.header>
  );
}

function MobileMenu() {
  const t = useTranslations("landing.nav");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-sm" className="lg:hidden" aria-label={t("openMenu")}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] gap-0 p-6">
        <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
        <Logo />
        <nav aria-label={t("menu")} className="mt-8">
          <ul className="grid gap-1">
            {LINKS.map(([href, key], i) => (
              <m.li
                key={href}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring.ui, delay: 0.04 * i }}
              >
                <SheetClose asChild>
                  <a
                    href={href}
                    className="block rounded-xl px-3 py-3 font-display text-2xl font-bold tracking-tight hover:bg-secondary"
                  >
                    {t(key)}
                  </a>
                </SheetClose>
              </m.li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto grid gap-2 pt-8">
          <ThemeToggle label={t("theme")} />
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">{t("signIn")}</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/sign-up">{t("start")}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
