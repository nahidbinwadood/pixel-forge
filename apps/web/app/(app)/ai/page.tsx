import { CREDIT_COSTS } from "@pixelforge/shared";
import { ReceiptTextIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiNotice } from "@/components/ai/ai-notice";
import { CreditsLine } from "@/components/ai/credits-line";
import { HistoryRail } from "@/components/ai/history-rail";
import { ToolCard, ToolGrid } from "@/components/ai/tool-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listHistory } from "@/lib/ai/history";
import { creditsInfo } from "@/lib/ai/page-data";
import { aiStatus } from "@/lib/ai/provider";
import { requireUser } from "@/lib/api";

export const metadata: Metadata = { title: "AI studio" };

const TOOLS = [
  { tool: "text_to_image", href: "/ai/generate", perImage: true },
  { tool: "bg_remove", href: "/ai/remove-background", perImage: false },
  { tool: "write", href: "/ai/write", perImage: false },
] as const;

/** AI hub: honest provider status, balance, one tile per tool with its cost, recent runs. */
export default async function AiHubPage() {
  const user = await requireUser();
  const [t, credits, recent] = await Promise.all([
    getTranslations("ai"),
    creditsInfo(user.id),
    listHistory(user.id, { limit: 6 }),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} action={<CreditsLine credits={credits} />} />
      <AiNotice status={aiStatus()} />
      <ToolGrid>
        {TOOLS.map(({ tool, href, perImage }) => (
          <ToolCard
            key={tool}
            tool={tool}
            href={href}
            name={t(`tools.${tool}.name`)}
            desc={t(`tools.${tool}.desc`)}
            cost={perImage ? t("costPer", { count: CREDIT_COSTS[tool] }) : t("cost", { count: CREDIT_COSTS[tool] })}
          />
        ))}
      </ToolGrid>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="max-w-xl">
          <HistoryRail initial={recent.items} initialCursor={recent.nextCursor} refreshKey={0} />
        </div>
        <div className="flex items-start lg:justify-end">
          <Button asChild variant="secondary">
            <Link href="/ai/history">
              <ReceiptTextIcon aria-hidden />
              {t("usage.link")}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
