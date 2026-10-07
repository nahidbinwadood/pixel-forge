import { PLANS, type PlanId } from "@pixelforge/shared";
import { CheckIcon, MinusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

const PLAN_IDS: PlanId[] = ["free", "plus", "pro", "team"];
const ROWS = [
  "monthlyCredits",
  "maxExportPx",
  "watermark",
  "premiumContent",
  "storageMb",
  "maxUploadMb",
  "seats",
] as const;

/** Static feature comparison, straight from packages/shared/src/plans.ts. Server component: no interactivity. */
export async function ComparisonTable() {
  const t = await getTranslations("billing.pricing.comparison");

  function cell(planId: PlanId, row: (typeof ROWS)[number]): ReactNode {
    const plan = PLANS[planId];
    switch (row) {
      case "monthlyCredits":
        return plan.monthlyCredits;
      case "maxExportPx":
        return t("px", { px: plan.maxExportPx });
      case "watermark":
        return plan.watermark ? t("watermarkOn") : t("watermarkOff");
      case "premiumContent":
        return plan.premiumContent ? (
          <CheckIcon aria-label={t("yes")} className="size-4 text-success" />
        ) : (
          <MinusIcon aria-label={t("no")} className="size-4 text-muted-foreground" />
        );
      case "storageMb":
        return t("gb", { gb: Math.round(plan.storageMb / 1024) });
      case "maxUploadMb":
        return t("mb", { mb: plan.maxUploadMb });
      case "seats":
        return plan.seats;
      default:
        return null;
    }
  }

  return (
    <Reveal>
      <h2 className="text-h1 text-center">{t("title")}</h2>
      <div className="mt-8 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-surface-1">
              <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                {" "}
              </th>
              {PLAN_IDS.map((id) => (
                <th key={id} scope="col" className="px-4 py-3 text-start font-semibold">
                  {PLANS[id].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row} className="border-b last:border-b-0">
                <th scope="row" className="px-4 py-3 text-start font-normal text-text-2">
                  {t(`rows.${row}`)}
                </th>
                {PLAN_IDS.map((id) => (
                  <td key={id} className="px-4 py-3 tabular-nums">
                    {cell(id, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}
