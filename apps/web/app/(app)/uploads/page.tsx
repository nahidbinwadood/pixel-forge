import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { userPlan } from "@/lib/account";
import { requireUser } from "@/lib/api";
import { UploadsClient } from "./uploads-client";

export const metadata: Metadata = { title: "Uploads" };

export default async function UploadsPage() {
  const user = await requireUser();
  const [plan, t] = await Promise.all([userPlan(user.id), getTranslations("uploads")]);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <UploadsClient maxMb={plan.maxUploadMb} userId={user.id} />
    </div>
  );
}
