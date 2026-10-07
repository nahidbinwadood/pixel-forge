"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * PRD US7.3: premium templates are free to open; only export quality is gated, and billing isn't
 * live yet (ASSUMPTIONS D14/paywall.json), so this is informational, not a blocker.
 */
export function PremiumInfoDialog({ trigger }: { trigger: ReactNode }) {
  const t = useTranslations("templates");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* A real button (not a span): stops the click from also opening the card's detail dialog,
            and gets native keyboard activation for free. */}
        <button type="button" onClick={(e) => e.stopPropagation()} className="inline-flex">
          {trigger}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("premiumInfoTitle")}</DialogTitle>
          <DialogDescription>{t("premiumInfoBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
