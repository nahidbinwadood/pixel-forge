"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function TwoFactorPage() {
  const t = useTranslations("auth");
  const [backup, setBackup] = useState(false);
  return (
    <AuthForm
      title={t("twoFactorTitle")}
      submitLabel={t("verify")}
      onSubmit={async (data) => {
        const code = String(data.get("code")).trim();
        const { error } = backup
          ? await authClient.twoFactor.verifyBackupCode({ code })
          : await authClient.twoFactor.verifyTotp({ code, trustDevice: true });
        if (error) return error.status === 429 ? t("rateLimited") : (error.message ?? t("invalidCredentials"));
        window.location.assign("/home");
      }}
      footer={
        <Button type="button" variant="link" onClick={() => setBackup((b) => !b)}>
          {backup ? t("twoFactorCode") : t("twoFactorBackup")}
        </Button>
      }
    >
      <div className="grid gap-2">
        <Label htmlFor="code">{backup ? t("twoFactorBackup") : t("twoFactorCode")}</Label>
        <Input
          id="code"
          name="code"
          required
          autoComplete="one-time-code"
          inputMode={backup ? "text" : "numeric"}
          pattern={backup ? undefined : "[0-9]{6}"}
          autoFocus
        />
      </div>
    </AuthForm>
  );
}
