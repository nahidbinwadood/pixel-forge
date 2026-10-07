"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormPassword } from "@/components/form/form-password";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { duration, ease } from "@/lib/motion";
import { SettingsCard } from "./settings-section";

type Setup = { totpURI: string; backupCodes: string[] };

export function TwoFactorForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("settings");
  const [on, setOn] = useState(enabled);
  const [setup, setSetup] = useState<Setup | null>(null);

  return (
    <SettingsCard
      title={t("twoFactor")}
      description={t("twoFactorDesc")}
      aside={<Badge variant={on ? "success" : "secondary"}>{on ? t("twoFactorOn") : t("twoFactorOff")}</Badge>}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={setup ? "verify" : "confirm"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: duration.panel, ease: ease.out }}
        >
          {setup ? (
            <VerifyStep
              setup={setup}
              onDone={() => {
                setSetup(null);
                setOn(true);
              }}
            />
          ) : (
            <ConfirmStep on={on} onDisabled={() => setOn(false)} onSetup={(s) => setSetup(s)} />
          )}
        </m.div>
      </AnimatePresence>
    </SettingsCard>
  );
}

function ConfirmStep({
  on,
  onDisabled,
  onSetup,
}: {
  on: boolean;
  onDisabled: () => void;
  onSetup: (s: Setup) => void;
}) {
  const t = useTranslations("settings");
  const ta = useTranslations("auth");
  const schema = z.object({ password: z.string().min(1, t("passwordRequired")) });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "" } });

  async function submit({ password }: Values) {
    if (on) {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) return form.setError("root", { message: error.message ?? ta("invalidCredentials") });
      form.reset();
      onDisabled();
      return;
    }
    const { data, error } = await authClient.twoFactor.enable({ password });
    if (error || !data || !("totpURI" in data)) {
      return form.setError("root", { message: error?.message ?? ta("invalidCredentials") });
    }
    form.reset();
    onSetup(data);
  }

  return (
    <Form form={form} onSubmit={submit} className="gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <FormPassword<Values> name="password" label={t("confirmPassword")} className="flex-1" />
        <FormSubmit variant={on ? "outline" : "secondary"} className="sm:mt-7">
          {on ? t("disable2fa") : t("enable2fa")}
        </FormSubmit>
      </div>
      <FormRootError />
    </Form>
  );
}

function VerifyStep({ setup, onDone }: { setup: Setup; onDone: () => void }) {
  const t = useTranslations("settings");
  const ta = useTranslations("auth");
  const schema = z.object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, t("codeInvalid")),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { code: "" } });
  const secret = new URL(setup.totpURI).searchParams.get("secret") ?? "";

  async function verify({ code }: Values) {
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    if (error) return form.setError("root", { message: error.message ?? ta("invalidCredentials") });
    toast.success(t("twoFactorOn"));
    onDone();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-start gap-3">
        <TotpQr uri={setup.totpURI} />
        <p className="max-w-[180px] text-xs text-muted-foreground">{t("secretFallback")}</p>
        <code className="max-w-[180px] break-all rounded-md bg-secondary px-2 py-1 font-mono text-xs">{secret}</code>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-2">{t("scanQr")}</p>
        <div className="grid gap-2">
          <p className="text-sm font-medium">{t("backupCodes")}</p>
          <ul className="grid grid-cols-2 gap-1.5 rounded-xl border bg-surface-1 p-3 font-mono text-sm">
            {setup.backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <Form form={form} onSubmit={verify} className="gap-4">
          <FormInput<Values>
            name="code"
            label={ta("twoFactorCode")}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="max-w-xs"
          />
          <FormRootError />
          <FormSubmit className="self-start">{ta("verify")}</FormSubmit>
        </Form>
      </div>
    </div>
  );
}

/** Rendered locally: the TOTP secret must never be sent to a third-party QR service. */
function TotpQr({ uri }: { uri: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    void QRCode.toDataURL(uri, { width: 180, margin: 1 }).then(setSrc);
  }, [uri]);
  if (!src) return <div className="size-[180px] rounded-xl shimmer bg-secondary" />;
  return (
    // biome-ignore lint/performance/noImgElement: local data URL
    <img
      src={src}
      alt="QR code for your authenticator app"
      width={180}
      height={180}
      className="rounded-xl bg-white p-1"
    />
  );
}
