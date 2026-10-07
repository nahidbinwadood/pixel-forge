import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CreditsLine } from "@/components/ai/credits-line";
import { UsageTable } from "@/components/ai/usage-table";
import { PageHeader } from "@/components/shared/page-header";
import { listLedger } from "@/lib/ai/credits";
import { creditsInfo } from "@/lib/ai/page-data";
import { requireUser } from "@/lib/api";

export const metadata: Metadata = { title: "Credit usage" };

export default async function CreditUsagePage() {
  const user = await requireUser();
  const [t, credits, ledger] = await Promise.all([
    getTranslations("ai.usage"),
    creditsInfo(user.id),
    listLedger(user.id, { limit: 25 }),
  ]);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} action={<CreditsLine credits={credits} />} />
      <UsageTable initial={ledger.items} initialCursor={ledger.nextCursor} />
    </div>
  );
}
