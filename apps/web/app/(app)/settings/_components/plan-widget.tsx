"use client";

import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CreditMeter } from "@/components/shared/credit-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "./settings-section";

/** Plan + credits at a glance. Upgrade is a waitlist placeholder until billing (Phase 5). */
export function PlanWidget({ planName, balance, allowance }: { planName: string; balance: number; allowance: number }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  return (
    <SettingsCard
      title={t("plan")}
      aside={
        <Badge variant="secondary" className="font-mono">
          {t("planName", { plan: planName })}
        </Badge>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CreditMeter balance={balance} allowance={allowance} label={tc("credits", { count: balance })} />
          <p className="text-sm text-text-2">{t("creditsLeft", { count: balance, total: allowance })}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="premium">
            <SparklesIcon aria-hidden /> {t("upgrade")}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => toast(t("waitlist"))}>
            {t("joinWaitlist")}
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}
