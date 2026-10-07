"use client";

import { cn } from "cn";
import { m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { spring } from "@/lib/motion";

export function AdminTabs({ tabs, label }: { tabs: { href: string; label: string }[]; label: string }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1">
        {tabs.map(({ href, label: text }) => {
          const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
          return (
            <li key={href} className="relative shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block px-3 py-2.5 text-sm transition-colors",
                  active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {text}
              </Link>
              {active && (
                <m.span
                  layoutId="admin-tab-indicator"
                  transition={spring.ui}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
