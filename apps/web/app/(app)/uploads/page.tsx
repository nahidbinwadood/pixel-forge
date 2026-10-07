import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { userPlan } from "@/lib/account";
import { requireUser } from "@/lib/api";
import { UploadsClient } from "./uploads-client";

export const metadata: Metadata = { title: "Uploads" };

export default async function UploadsPage() {
  const user = await requireUser();
  const [plan, t] = await Promise.all([userPlan(user.id), getTranslations("uploads")]);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <UploadsClient maxMb={plan.maxUploadMb} userId={user.id} />
    </div>
  );
}
