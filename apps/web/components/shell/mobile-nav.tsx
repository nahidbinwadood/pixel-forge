"use client";

import { cn } from "cn";
import { m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { spring } from "@/lib/motion";
import { isActive, visibleNav } from "./nav-items";

/** Bottom nav < md. Active = filled pill behind the icon (shape, not just color) + bold label. */
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("main")}
      className="fixed inset-x-0 bottom-0 z-40 border-t glass pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex justify-around px-2 py-1.5">
        {visibleNav(isAdmin).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px]",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="relative grid h-8 w-14 place-items-center">
                  {active && (
                    <m.span
                      layoutId="mobile-active"
                      transition={spring.ui}
                      className="absolute inset-0 rounded-full bg-accent ring-1 ring-primary/40"
                      aria-hidden
                    />
                  )}
                  <Icon className="relative size-5" strokeWidth={1.75} aria-hidden />
                </span>
                {t(label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
