"use client";

import { cn } from "cn";
import { HomeIcon, ImageIcon, LayoutTemplateIcon, SettingsIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function AppNav({ isAdmin, variant }: { isAdmin: boolean; variant: "sidebar" | "bottom" }) {
  const t = useTranslations("nav");
  const path = usePathname();
  const items = [
    { href: "/home", label: t("home"), icon: HomeIcon },
    { href: "/uploads", label: t("uploads"), icon: ImageIcon },
    { href: "/templates", label: t("templates"), icon: LayoutTemplateIcon, soon: true },
    { href: "/settings", label: t("settings"), icon: SettingsIcon },
    ...(isAdmin ? [{ href: "/admin", label: t("admin"), icon: ShieldIcon }] : []),
  ];

  if (variant === "bottom") {
    return (
      <nav
        aria-label={t("menu")}
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background/95 py-2 backdrop-blur md:hidden"
      >
        {items
          .filter((i) => !i.soon)
          .map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-xs",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
      </nav>
    );
  }

  return (
    <nav aria-label={t("menu")} className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon, soon }) => {
        const active = path.startsWith(href);
        if (soon) {
          return (
            <span
              key={href}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground/60"
            >
              <Icon className="size-4" aria-hidden />
              {label}
              <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
            </span>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent",
              active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
