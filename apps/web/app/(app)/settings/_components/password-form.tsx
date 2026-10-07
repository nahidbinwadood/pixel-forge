"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@pixelforge/shared";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormPassword } from "@/components/form/form-password";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { authClient } from "@/lib/auth-client";
import { SettingsCard } from "./settings-section";

export function PasswordForm() {
  const t = useTranslations("settings");
  const ta = useTranslations("auth");
  const schema = z.object({
    currentPassword: z.string().min(1, t("currentRequired")),
    newPassword: passwordSchema,
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "" },
    mode: "onTouched",
  });

  async function save(values: Values) {
    const { error } = await authClient.changePassword({ ...values, revokeOtherSessions: true });
    if (error) return form.setError("root", { message: error.message ?? ta("invalidCredentials") });
    form.reset();
    toast.success(t("passwordChanged"));
  }

  return (
    <SettingsCard title={t("changePassword")}>
      <Form form={form} onSubmit={save}>
        <FormPassword<Values> name="currentPassword" label={t("currentPassword")} autoComplete="current-password" />
        <FormPassword<Values> name="newPassword" label={t("newPassword")} autoComplete="new-password" showRules />
        <FormRootError />
        <div className="flex justify-end">
          <FormSubmit variant="secondary">{t("changePassword")}</FormSubmit>
        </div>
      </Form>
    </SettingsCard>
  );
}
