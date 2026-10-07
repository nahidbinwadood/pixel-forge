"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { Reveal } from "@/components/motion/reveal";

const schema = z.object({ email: z.email("Enter a valid email") });
type Values = z.infer<typeof schema>;

/** Rate-limited (api/v1/billing/waitlist); stores email + optional planId in WaitlistEntry. */
export function WaitlistSection() {
  const t = useTranslations("billing.pricing.waitlist");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function join(values: Values) {
    const res = await fetch("/api/v1/billing/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, source: "pricing_page" }),
    });
    if (!res.ok) return form.setError("root", { message: t("error") });
    form.reset();
    toast.success(t("success"));
  }

  return (
    <Reveal className="mx-auto max-w-md rounded-3xl border bg-card p-8 text-center">
      <h2 className="text-h2">{t("title")}</h2>
      <p className="mt-2 text-text-2">{t("body")}</p>
      <Form form={form} onSubmit={join} className="mt-5 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <FormInput<Values> name="email" label={t("email")} hideLabel type="email" placeholder={t("email")} />
          </div>
          <FormSubmit>{t("submit")}</FormSubmit>
        </div>
        <FormRootError />
      </Form>
    </Reveal>
  );
}
