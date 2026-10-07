"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "./settings-section";

export function DataSection() {
  const t = useTranslations("settings");
  return (
    <>
      <SettingsCard title={t("export")} description={t("exportDesc")}>
        <Button asChild variant="secondary" className="self-start">
          <a href="/api/v1/me/export" download>
            <DownloadIcon aria-hidden />
            {t("export")}
          </a>
        </Button>
      </SettingsCard>
      <DeleteAccountForm />
    </>
  );
}

function DeleteAccountForm() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const schema = z.object({ confirm: z.literal("DELETE", { error: t("deleteMismatch") }) });
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { confirm: "" as "DELETE" } });
  const typed = form.watch("confirm") === "DELETE";

  async function remove() {
    const res = await fetch("/api/v1/me", { method: "DELETE" });
    if (!res.ok) return form.setError("root", { message: tc("error") });
    window.location.assign("/");
  }

  return (
    <SettingsCard tone="danger" title={t("deleteAccount")} description={t("deleteDesc")}>
      <Form form={form} onSubmit={remove} className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <FormInput<Values> name="confirm" label={t("deleteConfirm")} autoComplete="off" className="flex-1" />
          <FormSubmit variant="destructive" disabled={!typed} className="sm:mt-7">
            {t("deleteAccount")}
          </FormSubmit>
        </div>
        <FormRootError />
      </Form>
    </SettingsCard>
  );
}
