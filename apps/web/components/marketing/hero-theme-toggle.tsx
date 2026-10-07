"use client";

import { cn } from "cn";
import { MoonIcon, SunIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { spring } from "@/lib/motion";

const noop = () => () => {};

/** Light/dark icon toggle for marketing chrome (nav + footer). Hydration-safe: renders a blank slot on the server. */
export function ThemeToggle({ label, className }: { label: string; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      aria-pressed={mounted ? dark : undefined}
      className={cn(
        "relative grid size-9 place-items-center overflow-hidden rounded-full border bg-surface-1/70 text-text-2 transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
        className,
      )}
    >
      {mounted && (
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={dark ? "moon" : "sun"}
            initial={{ y: 14, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -14, opacity: 0, rotate: 45 }}
            transition={spring.snappy}
            className="flex"
          >
            {dark ? <MoonIcon className="size-4" aria-hidden /> : <SunIcon className="size-4" aria-hidden />}
          </m.span>
        </AnimatePresence>
      )}
    </button>
  );
}
