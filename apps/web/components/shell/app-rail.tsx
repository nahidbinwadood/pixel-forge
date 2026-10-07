"use client";

import { cn } from "cn";
import { m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogoMark } from "@/components/brand/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { spring } from "@/lib/motion";
import { isActive, visibleNav } from "./nav-items";

/** Desktop icon rail (64px). Labels live in tooltips + aria; the active pill glides between items. */
export function AppRail({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col items-center gap-6 border-e bg-surface-1 py-4 md:flex">
      <Link
        href="/home"
        className="rounded-lg transition-transform hover:scale-105"
        aria-label={`${t("home")}, PixelForge`}
      >
        <LogoMark className="size-8" />
      </Link>
      <TooltipProvider delayDuration={150}>
        <nav aria-label={t("main")}>
          <ul className="flex flex-col items-center gap-1.5">
            {visibleNav(isAdmin).map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        aria-label={t(label)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative grid size-11 place-items-center rounded-xl transition-colors",
                          active ? "text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        {active && (
                          <m.span
                            layoutId="rail-active"
                            transition={spring.ui}
                            className="absolute inset-0 rounded-xl bg-surface-3 surface-highlight"
                            aria-hidden
                          >
                            <span className="absolute inset-y-2.5 -start-[13px] w-[3px] rounded-full bg-aurora shadow-glow" />
                          </m.span>
                        )}
                        <Icon className="relative size-5" strokeWidth={1.75} aria-hidden />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      {t(label)}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
