import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { creditBalance, userPlan } from "@/lib/account";
import { requireUser } from "@/lib/api";
import {
  AppearanceForm,
  DangerZone,
  PasswordForm,
  ProfileForm,
  TwoFactorForm,
  VerifyEmailNotice,
} from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [plan, credits, t, tc] = await Promise.all([
    userPlan(user.id),
    creditBalance(user.id),
    getTranslations("settings"),
    getTranslations("common"),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      {!user.emailVerified && <VerifyEmailNotice email={user.email} />}

      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("plan")}</CardTitle>
          <CardDescription>
            {t("planName", { plan: plan.name })} · {tc("credits", { count: credits })}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AppearanceForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("security")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <PasswordForm />
          <TwoFactorForm enabled={Boolean(user.twoFactorEnabled)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("data")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  );
}
