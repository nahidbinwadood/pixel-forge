"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard, authErrorKind } from "@/components/auth-form";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { duration, ease } from "@/lib/motion";

export function TwoFactorForm() {
  const t = useTranslations("auth");
  const [backup, setBackup] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        code: backup
          ? z.string().trim().min(4, t("validation.code"))
          : z
              .string()
              .trim()
              .regex(/^\d{6}$/, t("validation.code")),
      }),
    [backup, t],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { code: "" } });

  async function onSubmit({ code }: Values) {
    const { error } = backup
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice: true });
    if (!error) {
      window.location.assign("/home");
      return;
    }
    form.setError("root", { message: authErrorKind(error) === "rateLimited" ? t("rateLimited") : t("invalidCode") });
  }

  return (
    <AuthCard
      title={t("twoFactorTitle")}
      subtitle={t("twoFactorSubtitle")}
      footer={
        <Button
          type="button"
          variant="link"
          onClick={() => {
            setBackup((b) => !b);
            form.reset({ code: "" });
          }}
        >
          {backup ? t("twoFactorUseApp") : t("twoFactorBackup")}
        </Button>
      }
    >
      <Form form={form} onSubmit={onSubmit}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={backup ? "backup" : "totp"}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: duration.micro, ease: ease.out }}
          >
            <FormInput<Values>
              name="code"
              label={backup ? t("backupCode") : t("twoFactorCode")}
              autoComplete="one-time-code"
              inputMode={backup ? "text" : "numeric"}
              maxLength={backup ? 32 : 6}
              autoFocus
              className={backup ? undefined : "[&_input]:font-mono [&_input]:text-lg [&_input]:tracking-[0.4em]"}
            />
          </m.div>
        </AnimatePresence>
        <FormRootError />
        <FormSubmit className="w-full">{t("verify")}</FormSubmit>
      </Form>
    </AuthCard>
  );
}
