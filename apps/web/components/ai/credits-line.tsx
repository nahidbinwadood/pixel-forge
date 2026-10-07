import { CoinsIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import type { CreditsInfo } from "@/lib/ai/page-data";

/** Balance + next top-up date; the numbers are mono per TOKENS. */
export async function CreditsLine({ credits }: { credits: CreditsInfo }) {
  const [t, format] = await Promise.all([getTranslations("ai"), getFormatter()]);
  return (
    <div className="flex items-center gap-2.5 rounded-full border bg-surface-1 py-1.5 ps-2 pe-4 text-sm">
      <span className="grid size-7 place-items-center rounded-full bg-surface-3 text-primary">
        <CoinsIcon className="size-4" aria-hidden />
      </span>
      <span className="grid leading-tight">
        <span className="font-mono font-medium tabular-nums">{t("balance", { balance: credits.balance })}</span>
        <span className="text-xs text-muted-foreground">
          {t("refill", {
            allowance: credits.allowance,
            date: format.dateTime(new Date(credits.refillDate), { month: "short", day: "numeric" }),
          })}
        </span>
      </span>
    </div>
  );
}
