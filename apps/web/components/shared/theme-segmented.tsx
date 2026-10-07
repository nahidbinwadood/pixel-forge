"use client";

import { cn } from "cn";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { type KeyboardEvent, useSyncExternalStore } from "react";
import { spring } from "@/lib/motion";

const noop = () => () => {};
const OPTIONS = [
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
  { value: "system", icon: MonitorIcon },
] as const;

/**
 * Theme as a segmented control (ARIA radiogroup, arrow-key navigation). Applies instantly — it's a preference,
 * not a form submission. Renders a placeholder on the server: the theme is only known on the client.
 */
export function ThemeSegmented({ className, layoutId = "theme-segment" }: { className?: string; layoutId?: string }) {
  const t = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  if (!mounted) return <div className={cn("h-11 w-full max-w-sm rounded-xl bg-secondary", className)} />;

  const current = theme ?? "dark";
  const onKey = (e: KeyboardEvent) => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const i = OPTIONS.findIndex((o) => o.value === current);
    const next = OPTIONS[(i + dir + OPTIONS.length) % OPTIONS.length];
    if (next) {
      setTheme(next.value);
      document.getElementById(`${layoutId}-${next.value}`)?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("theme")}
      onKeyDown={onKey}
      className={cn("grid w-full max-w-sm grid-cols-3 gap-1 rounded-xl border bg-secondary/60 p-1", className)}
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const checked = value === current;
        return (
          // biome-ignore lint/a11y/useSemanticElements: ARIA radio-group pattern; the moving pill needs a button, not <input>
          <button
            key={value}
            id={`${layoutId}-${value}`}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex h-9 items-center justify-center gap-2 rounded-lg text-sm transition-colors",
              checked ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {checked && (
              <m.span
                layoutId={layoutId}
                transition={spring.ui}
                className="absolute inset-0 -z-10 rounded-lg bg-card shadow-card"
                aria-hidden
              />
            )}
            <Icon className="size-4" aria-hidden />
            {t(value)}
          </button>
        );
      })}
    </div>
  );
}
