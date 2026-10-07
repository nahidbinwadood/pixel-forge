"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuthForm, nextPath } from "@/components/auth-form";
import { GoogleButton } from "@/components/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ google }: { google: boolean }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [linkMsg, setLinkMsg] = useState<string>();

  async function sendMagicLink() {
    if (!email) return;
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: nextPath() });
    setLinkMsg(error?.status === 429 ? t("rateLimited") : t("magicLinkSent"));
  }

  return (
    <AuthForm
      title={t("signInTitle")}
      submitLabel={t("signIn")}
      onSubmit={async (data) => {
        const { error } = await authClient.signIn.email({
          email: String(data.get("email")),
          password: String(data.get("password")),
        });
        if (!error) {
          // 2FA users are redirected to /two-factor by the client plugin before this resolves.
          window.location.assign(nextPath());
          return;
        }
        if (error.status === 429) return t("rateLimited");
        if (error.status === 403) return error.message;
        return t("invalidCredentials");
      }}
      footer={
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          {google && <GoogleButton />}
          <Button type="button" variant="outline" className="w-full" onClick={sendMagicLink} disabled={!email}>
            {t("magicLink")}
          </Button>
          {linkMsg && (
            <p role="status" className="text-muted-foreground">
              {linkMsg}
            </p>
          )}
          <p className="text-muted-foreground">
            {t("noAccount")}{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/sign-up">
              {t("signUp")}
            </Link>
          </p>
        </div>
      }
    >
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("password")}</Label>
          <Link href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            {t("forgot")}
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
    </AuthForm>
  );
}
