import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiNotice } from "@/components/ai/ai-notice";
import { CreditsLine } from "@/components/ai/credits-line";
import { RemoveBgTool } from "@/components/ai/remove-bg-tool";
import { userPlan } from "@/lib/account";
import { pickableUploads, toolPageData } from "@/lib/ai/page-data";
import { requireUser } from "@/lib/api";

export const metadata: Metadata = { title: "Background remover" };

/** `?asset=<id>` preselects an upload (e.g. linked from the library). */
export default async function RemoveBackgroundPage({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const user = await requireUser();
  const [t, data, uploads, plan, sp] = await Promise.all([
    getTranslations("ai"),
    toolPageData(user.id, "bg_remove"),
    pickableUploads(user.id),
    userPlan(user.id),
    searchParams,
  ]);
  const initialAssetId = uploads.some((u) => u.id === sp.asset) ? sp.asset : undefined;
  return (
    <RemoveBgTool
      userId={user.id}
      ready={data.status.ready}
      credits={data.credits}
      history={data.history}
      nextCursor={data.nextCursor}
      uploads={uploads}
      maxMb={plan.maxUploadMb}
      initialAssetId={initialAssetId}
      title={t("tools.bg_remove.title")}
      backLabel={t("back")}
      meta={<CreditsLine credits={data.credits} />}
      notice={<AiNotice status={data.status} />}
    />
  );
}
