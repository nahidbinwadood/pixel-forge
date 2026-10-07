"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard, AuthDivider, AuthNotice, authErrorKind, nextPath } from "@/components/auth-form";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormPassword } from "@/components/form/form-password";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { GoogleButton } from "@/components/google-button";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ google }: { google: boolean }) {
  const t = useTranslations("auth");
  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("validation.email")),
        password: z.string().min(1, t("validation.password")),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const [linkState, setLinkState] = useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(values: Values) {
    const { error } = await authClient.signIn.email(values);
    if (!error) {
      // 2FA users are redirected to /two-factor by the client plugin before this resolves.
      window.location.assign(nextPath());
      return;
    }
    const kind = authErrorKind(error);
    form.setError("root", {
      message:
        kind === "rateLimited"
          ? t("rateLimited")
          : kind === "forbidden"
            ? (error.message ?? t("genericError"))
            : t("invalidCredentials"),
    });
  }

  async function sendMagicLink() {
    if (!(await form.trigger("email"))) {
      form.setFocus("email");
      return;
    }
    setLinkState("sending");
    const { error } = await authClient.signIn.magicLink({ email: form.getValues("email"), callbackURL: nextPath() });
    if (error && authErrorKind(error) === "rateLimited") {
      form.setError("root", { message: t("rateLimited") });
      setLinkState("idle");
      return;
    }
    setLinkState("sent");
  }

  return (
    <AuthCard
      title={t("signInTitle")}
      subtitle={t("signInSubtitle")}
      footer={
        <p className="text-text-2">
          {t("noAccount")}{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/sign-up">
            {t("signUp")}
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
          <FormInput<Values> name="email" label={t("email")} type="email" autoComplete="email" />
          <div className="grid gap-2">
            <FormPassword<Values> name="password" label={t("password")} autoComplete="current-password" />
            <Link
              href="/forgot-password"
              className="justify-self-end text-sm text-text-2 underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("forgot")}
            </Link>
          </div>
          <FormRootError />
          <FormSubmit className="w-full">{t("signIn")}</FormSubmit>
        </Form>

        <AuthDivider label={t("or")} />
        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={linkState === "sending"}
            onClick={sendMagicLink}
          >
            {linkState !== "sending" && <MailIcon aria-hidden />}
            {t("magicLink")}
          </Button>
          {linkState === "sent" ? (
            <AuthNotice>{t("magicLinkSent")}</AuthNotice>
          ) : (
            <p className="text-xs text-muted-foreground">{t("magicLinkHint")}</p>
          )}
        </div>
      </div>
    </AuthCard>
  );
}
