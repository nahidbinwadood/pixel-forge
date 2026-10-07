"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard, AuthNotice, authErrorKind } from "@/components/auth-form";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const schema = useMemo(() => z.object({ email: z.email(t("validation.email")) }), [t]);
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  const [sent, setSent] = useState(false);

  async function onSubmit({ email }: Values) {
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    if (error && authErrorKind(error) === "rateLimited") {
      form.setError("root", { message: t("rateLimited") });
      return;
    }
    // Same message whether or not the account exists.
    setSent(true);
  }

  return (
    <AuthCard
      title={t("forgotTitle")}
      subtitle={t("forgotSubtitle")}
      footer={
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-text-2 underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t("backToSignIn")}
        </Link>
      }
    >
      <Form form={form} onSubmit={onSubmit}>
        <FormInput<Values> name="email" label={t("email")} type="email" autoComplete="email" />
        <FormRootError />
        {sent && <AuthNotice>{t("forgotSent")}</AuthNotice>}
        <FormSubmit className="w-full">{t("forgotSend")}</FormSubmit>
      </Form>
    </AuthCard>
  );
}
