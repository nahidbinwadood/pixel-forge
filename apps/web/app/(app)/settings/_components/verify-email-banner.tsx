"use client";

import { MailWarningIcon } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { spring } from "@/lib/motion";

export function VerifyEmailBanner({ email }: { email: string }) {
  const t = useTranslations("settings");
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/settings" });
    setSending(false);
    if (error) toast.error(error.message ?? "");
    else toast.success(t("verificationSent"));
  }

  return (
    <m.div
      role="status"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring.soft}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
        <MailWarningIcon className="size-4" aria-hidden />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="text-sm font-semibold">{t("verifyBannerTitle")}</p>
        <p className="text-sm text-text-2">{t("emailUnverified")}</p>
      </div>
      <Button size="sm" variant="secondary" loading={sending} onClick={resend}>
        {t("resendVerification")}
      </Button>
    </m.div>
  );
}
