"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { keyLabel, SHORTCUTS } from "./shortcuts";

const GROUPS = ["edit", "arrange", "view"] as const;

/** Keyboard shortcuts overlay, opened with `?` (PRD US3.7). */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("editor");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("shortcuts")}</DialogTitle>
          <DialogDescription>{t("shortcutsHint")}</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-6 overflow-y-auto sm:grid-cols-3">
          {GROUPS.map((g) => (
            <section key={g} className="grid content-start gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-text-2 uppercase">{t(`shortcutGroup.${g}`)}</h3>
              <dl className="grid gap-1.5">
                {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <dt>{t(`shortcut.${s.id}`)}</dt>
                    <dd className="flex shrink-0 gap-1">
                      {s.keys.map((k) => (
                        <kbd key={k} className="rounded-md border bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
                          {keyLabel(k)}
                        </kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
