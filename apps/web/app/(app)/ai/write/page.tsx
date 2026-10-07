import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiNotice } from "@/components/ai/ai-notice";
import { CreditsLine } from "@/components/ai/credits-line";
import { WriteTool } from "@/components/ai/write-tool";
import { toolPageData } from "@/lib/ai/page-data";
import { requireUser } from "@/lib/api";

export const metadata: Metadata = { title: "AI writer" };

export default async function WritePage() {
  const user = await requireUser();
  const [t, data] = await Promise.all([getTranslations("ai"), toolPageData(user.id, "write")]);
  return (
    <WriteTool
      userId={user.id}
      ready={data.status.ready}
      credits={data.credits}
      history={data.history}
      nextCursor={data.nextCursor}
      title={t("tools.write.title")}
      backLabel={t("back")}
      meta={<CreditsLine credits={data.credits} />}
      notice={<AiNotice status={data.status} />}
    />
  );
}
