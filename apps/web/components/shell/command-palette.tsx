"use client";

import { LogOutIcon, MoonIcon, SearchIcon, SunIcon, UploadIcon } from "lucide-react";
import { m } from "motion/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Kbd } from "@/components/shared/page-header";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { authClient } from "@/lib/auth-client";
import { fadeUp, stagger } from "@/lib/motion";
import { visibleNav } from "./nav-items";

function isTypingTarget(el: EventTarget | null) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/** Search trigger + ⌘K palette (compound: trigger and dialog share one open state). */
export function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K /"
        className="group flex h-10 min-w-10 items-center gap-2.5 rounded-lg border bg-surface-1/60 px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground md:w-72"
      >
        <SearchIcon className="size-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-start md:inline">{t("search")}</span>
        <span className="sr-only md:hidden">{t("searchShort")}</span>
        <Kbd className="hidden md:inline-flex">⌘K</Kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("palette.title")}
        description={t("palette.description")}
        className="glass shadow-float sm:max-w-lg"
      >
        <CommandInput placeholder={t("palette.placeholder")} />
        <CommandList>
          <CommandEmpty>{t("palette.empty")}</CommandEmpty>
          <m.div initial="hidden" animate="show" variants={stagger(0.03)}>
            <CommandGroup heading={t("palette.goTo")}>
              {visibleNav(isAdmin).map(({ href, label, icon: Icon }) => (
                <m.div key={href} variants={fadeUp}>
                  <CommandItem value={t(label)} onSelect={() => run(() => router.push(href))}>
                    <Icon aria-hidden />
                    {t(label)}
                  </CommandItem>
                </m.div>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("palette.actions")}>
              <m.div variants={fadeUp}>
                <CommandItem value={t("palette.upload")} onSelect={() => run(() => router.push("/uploads"))}>
                  <UploadIcon aria-hidden />
                  {t("palette.upload")}
                </CommandItem>
              </m.div>
              <m.div variants={fadeUp}>
                <CommandItem
                  value={t("palette.toggleTheme", { mode: t(nextTheme) })}
                  onSelect={() => run(() => setTheme(nextTheme))}
                >
                  {nextTheme === "dark" ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
                  {t("palette.toggleTheme", { mode: t(nextTheme) })}
                </CommandItem>
              </m.div>
              <m.div variants={fadeUp}>
                <CommandItem
                  value={t("signOut")}
                  onSelect={() =>
                    run(async () => {
                      await authClient.signOut();
                      window.location.assign("/");
                    })
                  }
                >
                  <LogOutIcon aria-hidden />
                  {t("signOut")}
                </CommandItem>
              </m.div>
            </CommandGroup>
          </m.div>
        </CommandList>
      </CommandDialog>
    </>
  );
}
