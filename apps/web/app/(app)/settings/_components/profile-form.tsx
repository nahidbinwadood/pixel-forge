"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { SettingsCard } from "./settings-section";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const schema = z.object({ name: z.string().trim().min(1, t("nameRequired")).max(80) });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name } });

  async function save(values: Values) {
    const res = await fetch("/api/v1/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) return form.setError("root", { message: tc("error") });
    form.reset(values);
    toast.success(t("saved"));
  }

  return (
    <SettingsCard>
      <Form form={form} onSubmit={save}>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">{t("email")}</span>
          <span className="truncate font-mono text-sm text-text-2">{email}</span>
        </div>
        <FormInput<Values>
          name="name"
          label={t("displayName")}
          description={t("displayNameHint")}
          autoComplete="name"
          maxLength={80}
        />
        <FormRootError />
        <div className="flex justify-end">
          <FormSubmit variant="secondary" disabled={!form.formState.isDirty}>
            {t("save")}
          </FormSubmit>
        </div>
      </Form>
    </SettingsCard>
  );
}
