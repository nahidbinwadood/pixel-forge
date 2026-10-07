"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Opens the Stripe customer portal (manage payment method, invoices, cancel). */
export function BillingManageButton() {
  const t = useTranslations("billing.settings");
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/billing/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: { message?: string } };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(data.error?.message ?? "Couldn't open billing portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" loading={loading} onClick={open}>
      {t("manage")}
    </Button>
  );
}
