"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@pixelforge/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard, AuthDivider, AuthNotice, authErrorKind } from "@/components/auth-form";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormPassword } from "@/components/form/form-password";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { GoogleButton } from "@/components/google-button";
import { track } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";

export function SignUpForm({ google }: { google: boolean }) {
  const t = useTranslations("auth");
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("validation.name")).max(80),
        email: z.email(t("validation.email")),
        password: passwordSchema,
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
  });
  const [notice, setNotice] = useState<string>();

  async function onSubmit(values: Values) {
    setNotice(undefined);
    const { data, error } = await authClient.signUp.email({ ...values, callbackURL: "/home" });
    if (!error) {
      track("signup_completed", { method: "email" }, data?.user.id);
      window.location.assign("/home");
      return;
    }
    switch (authErrorKind(error)) {
      case "rateLimited":
        form.setError("root", { message: t("rateLimited") });
        break;
      case "passwordPolicy":
        form.setError("password", { message: t("passwordPolicy") });
        break;
      case "exists":
        // Same neutral message as a fresh sign-up awaiting verification (PRD US1.1, no account enumeration).
        setNotice(t("checkEmail"));
        break;
      default:
        form.setError("root", { message: error.message ?? t("genericError") });
    }
  }

  return (
    <AuthCard
      title={t("signUpTitle")}
      subtitle={t("signUpSubtitle")}
      footer={
        <p className="text-text-2">
          {t("haveAccount")}{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/sign-in">
            {t("signIn")}
          </Link>
        </p>
      }
    >
      <div className="flex flex-col gap-5">
        {google && (
          <>
            <GoogleButton />
            <AuthDivider label={t("or")} />
          </>
        )}
        <Form form={form} onSubmit={onSubmit}>
          <FormInput<Values> name="name" label={t("name")} autoComplete="name" maxLength={80} />
          <FormInput<Values> name="email" label={t("email")} type="email" autoComplete="email" />
          <FormPassword<Values> name="password" label={t("password")} autoComplete="new-password" showRules />
          <FormRootError />
          {notice && <AuthNotice>{notice}</AuthNotice>}
          <FormSubmit className="w-full">{t("signUp")}</FormSubmit>
        </Form>
      </div>
    </AuthCard>
  );
}
