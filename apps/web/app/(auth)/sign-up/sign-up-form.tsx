"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthForm } from "@/components/auth-form";
import { GoogleButton } from "@/components/google-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";

export function SignUpForm({ google }: { google: boolean }) {
  const t = useTranslations("auth");
  return (
    <AuthForm
      title={t("signUpTitle")}
      submitLabel={t("signUp")}
      onSubmit={async (data) => {
        const { data: res, error } = await authClient.signUp.email({
          name: String(data.get("name")),
          email: String(data.get("email")),
          password: String(data.get("password")),
          callbackURL: "/home",
        });
        if (!error) {
          track("signup_completed", { method: "email" }, res?.user.id);
          window.location.assign("/home");
          return;
        }
        if (error.status === 429) return t("rateLimited");
        // Existing email: same neutral message as success-with-verification (PRD US1.1, no enumeration).
        if (error.status === 422 || error.code === "USER_ALREADY_EXISTS") return t("checkEmail");
        return error.message ?? t("checkEmail");
      }}
      footer={
        <div className="flex flex-col gap-3 text-sm">
          {google && <GoogleButton />}
          <p className="text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/sign-in">
              {t("signIn")}
            </Link>
          </p>
        </div>
      }
    >
      <div className="grid gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" autoComplete="name" required maxLength={80} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          {t("passwordHint")}
        </p>
      </div>
    </AuthForm>
  );
}
