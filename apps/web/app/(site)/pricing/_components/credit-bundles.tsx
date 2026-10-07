"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { CreditBundle } from "@/lib/billing/bundles";

export function CreditBundles({
  bundles,
  stripeEnabled,
  isSignedIn,
}: {
  bundles: readonly CreditBundle[];
  stripeEnabled: boolean;
  isSignedIn: boolean;
}) {
  const t = useTranslations("billing.pricing.bundles");
  const tc = useTranslations("billing.pricing.cta");
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function buy(bundle: CreditBundle) {
    if (!isSignedIn) {
      router.push("/sign-up?next=/pricing");
      return;
    }
    if (!stripeEnabled) {
      document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setLoadingId(bundle.id);
    const res = await fetch("/api/v1/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "credits", bundleId: bundle.id }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: { message?: string } };
    if (res.ok && data.url) {
      window.location.href = data.url;
      return;
    }
    toast.error(data.error?.message ?? "Couldn't start checkout. Try again.");
    setLoadingId(null);
  }

  return (
    <Reveal>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-h1">{t("title")}</h2>
        <p className="mt-2 text-text-2">{t("subtitle")}</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {bundles.map((bundle) => (
          <div key={bundle.id} className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center">
            <p className="font-display text-3xl font-bold">{t("credits", { count: bundle.credits })}</p>
            <p className="text-2xl font-semibold text-text-2">{t("price", { amount: bundle.priceUsd })}</p>
            <Button
              variant="secondary"
              className="w-full"
              loading={loadingId === bundle.id}
              onClick={() => buy(bundle)}
            >
              {stripeEnabled ? t("buy") : tc("waitlist")}
            </Button>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
