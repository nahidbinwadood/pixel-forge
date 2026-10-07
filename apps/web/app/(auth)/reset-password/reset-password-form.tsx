"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@pixelforge/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthCard, authErrorKind } from "@/components/auth-form";
import { Form } from "@/components/form/form";
import { FormPassword } from "@/components/form/form-password";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { authClient } from "@/lib/auth-client";

const schema = z.object({ password: passwordSchema });
type Values = z.infer<typeof schema>;

export function ResetPasswordForm({ token }: { token: string | null }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "" }, mode: "onTouched" });

  async function onSubmit({ password }: Values) {
    if (!token) {
      form.setError("root", { message: t("resetInvalid") });
      return;
    }
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (!error) {
      toast.success(t("resetDone"));
      router.push("/sign-in");
      return;
    }
    const kind = authErrorKind(error);
    if (kind === "passwordPolicy") form.setError("password", { message: t("passwordPolicy") });
    else form.setError("root", { message: kind === "rateLimited" ? t("rateLimited") : t("resetInvalid") });
  }

  return (
    <AuthCard
      title={t("resetTitle")}
      subtitle={t("resetSubtitle")}
      footer={
        <Link href="/forgot-password" className="text-text-2 underline-offset-4 hover:text-foreground hover:underline">
          {t("forgotTitle")}
        </Link>
      }
    >
      <Form form={form} onSubmit={onSubmit}>
        <FormPassword<Values> name="password" label={t("password")} autoComplete="new-password" showRules />
        <FormRootError />
        <FormSubmit className="w-full">{t("resetSubmit")}</FormSubmit>
      </Form>
    </AuthCard>
  );
}
