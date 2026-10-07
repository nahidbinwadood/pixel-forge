"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";
import { submitContact } from "./actions";

export function ContactForm() {
  const t = useTranslations("site.contact.form");
  const schema = z.object({
    name: z.string().trim().min(1, "Enter your name").max(100),
    email: z.email("Enter a valid email"),
    message: z.string().trim().min(10, "Say a bit more (10 characters minimum)").max(2000),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
  });

  async function send(values: Values) {
    const result = await submitContact(values);
    if (!result.ok) return form.setError("root", { message: result.error });
    form.reset();
    toast.success(t("success"));
  }

  return (
    <Form form={form} onSubmit={send}>
      <FormInput<Values> name="name" label={t("name")} autoComplete="name" />
      <FormInput<Values> name="email" label={t("email")} type="email" autoComplete="email" />
      <FormTextarea<Values> name="message" label={t("message")} placeholder={t("messagePlaceholder")} rows={6} />
      <FormRootError />
      <FormSubmit>{t("submit")}</FormSubmit>
    </Form>
  );
}
