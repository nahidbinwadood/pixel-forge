"use client";

import { useTranslations } from "next-intl";
import { AuthForm } from "@/components/auth-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  return (
    <AuthForm
      title={t("forgotTitle")}
      submitLabel={t("forgotSend")}
      onSubmit={async (data) => {
        const { error } = await authClient.requestPasswordReset({
          email: String(data.get("email")),
          redirectTo: "/reset-password",
        });
        // Same message whether or not the account exists.
        return error?.status === 429 ? t("rateLimited") : t("forgotSent");
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
    </AuthForm>
  );
}
