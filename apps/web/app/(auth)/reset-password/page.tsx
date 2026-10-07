"use client";

import { useTranslations } from "next-intl";
import { AuthForm } from "@/components/auth-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  return (
    <AuthForm
      title={t("resetTitle")}
      submitLabel={t("resetSubmit")}
      onSubmit={async (data) => {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) return t("resetInvalid");
        const { error } = await authClient.resetPassword({ newPassword: String(data.get("password")), token });
        if (error) return t("resetInvalid");
        window.location.assign("/sign-in");
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>
    </AuthForm>
  );
}
