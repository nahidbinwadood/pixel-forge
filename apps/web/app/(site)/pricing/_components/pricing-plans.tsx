"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "cn";
import { m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { liftHover, spring, stagger } from "@/lib/motion";
import type { BillingInterval } from "@/lib/billing/prices";

export interface PricingPlanRow {
  id: "plus" | "pro" | "team";
  name: string;
  monthlyCredits: number;
  monthlyUsd: number;
  monthlyAvailable: boolean;
  yearlyAvailable: boolean;
}

const POPULAR_ID = "pro";

async function startCheckout(body: unknown): Promise<string | null> {
  const res = await fetch("/api/v1/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: { message?: string } };
  if (!res.ok || !data.url) {
    toast.error(data.error?.message ?? "Couldn't start checkout. Try again.");
    return null;
  }
  return data.url;
}

export function PricingPlans({
  plans,
  isSignedIn,
  freeCredits,
}: {
  plans: PricingPlanRow[];
  isSignedIn: boolean;
  freeCredits: number;
}) {
  const t = useTranslations("billing.pricing");
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function subscribe(plan: PricingPlanRow) {
    if (!isSignedIn) {
      router.push("/sign-up?next=/pricing");
      return;
    }
    const available = interval === "monthly" ? plan.monthlyAvailable : plan.yearlyAvailable;
    if (!available) {
      document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setLoadingId(plan.id);
    const url = await startCheckout({ kind: "plan", planId: plan.id, interval });
    if (url) window.location.href = url;
    else setLoadingId(null);
  }

  return (
    <div className="grid gap-10">
      <div
        role="radiogroup"
        aria-label={t("title")}
        className="mx-auto flex items-center gap-1 rounded-full border bg-secondary/60 p-1"
      >
        {(["monthly", "yearly"] as const).map((value) => {
          const checked = interval === value;
          return (
            // biome-ignore lint/a11y/useSemanticElements: ARIA radio-group pattern; the moving pill needs a button
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => setInterval(value)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                checked ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {checked && (
                <m.span layoutId="pricing-interval" transition={spring.ui} className="absolute inset-0 -z-10 rounded-full bg-card shadow-card" aria-hidden />
              )}
              {t(`toggle.${value}`)}
              {value === "yearly" && (
                <Badge variant="success" className="ms-2">
                  {t("toggle.savings")}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      <m.div
        initial="hidden"
        animate="show"
        variants={stagger()}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Free is always available; no toggle/checkout needed. */}
        <m.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} {...liftHover}>
          <PlanCard
            name={t("plans.free.name")}
            blurb={t("plans.free.blurb")}
            priceLabel="$0"
            credits={freeCredits}
            action={
              <Button asChild variant="outline" className="w-full">
                <Link href={isSignedIn ? "/home" : "/sign-up"}>{isSignedIn ? t("cta.current") : t("cta.free")}</Link>
              </Button>
            }
          />
        </m.div>

        {plans.map((plan) => {
          const available = interval === "monthly" ? plan.monthlyAvailable : plan.yearlyAvailable;
          const price = interval === "monthly" ? plan.monthlyUsd : plan.monthlyUsd * 10;
          return (
            <m.div key={plan.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} {...liftHover}>
              <PlanCard
                name={plan.name}
                blurb={t(`plans.${plan.id}.blurb`)}
                priceLabel={`$${price}`}
                priceSuffix={interval === "monthly" ? t("perMonth") : t("perYear")}
                credits={plan.monthlyCredits}
                popular={plan.id === POPULAR_ID}
                popularLabel={t("mostPopular")}
                action={
                  <Button
                    className="w-full"
                    variant={plan.id === POPULAR_ID ? "premium" : "secondary"}
                    loading={loadingId === plan.id}
                    onClick={() => subscribe(plan)}
                  >
                    {available ? t("cta.subscribe") : t("cta.waitlist")}
                  </Button>
                }
              />
            </m.div>
          );
        })}
      </m.div>
    </div>
  );
}

function PlanCard({
  name,
  blurb,
  priceLabel,
  priceSuffix,
  credits,
  popular,
  popularLabel,
  action,
}: {
  name: string;
  blurb: string;
  priceLabel: string;
  priceSuffix?: string;
  credits: number;
  popular?: boolean;
  popularLabel?: string;
  action: ReactNode;
}) {
  const t = useTranslations("billing.pricing");
  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-5 rounded-3xl border bg-card p-6 surface-highlight",
        popular && "border-transparent bg-premium/[0.06] shadow-glow",
      )}
    >
      {popular && (
        <div className="absolute inset-0 -z-10 rounded-3xl bg-premium p-[1.5px]">
          <div className="h-full w-full rounded-[calc(1.5rem-1.5px)] bg-card" />
        </div>
      )}
      {popular && (
        <Badge variant="premium" className="absolute -top-3 start-6">
          {popularLabel}
        </Badge>
      )}
      <div className="grid gap-1">
        <h3 className="font-sans text-lg font-semibold">{name}</h3>
        <p className="text-sm text-text-2">{blurb}</p>
      </div>
      <p className="flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold tracking-tight">{priceLabel}</span>
        {priceSuffix && <span className="text-sm text-muted-foreground">{priceSuffix}</span>}
      </p>
      <p className="flex items-center gap-2 text-sm text-text-2">
        <CheckIcon aria-hidden className="size-4 text-primary" />
        {t("credits", { count: credits })}
      </p>
      <div className="mt-auto">{action}</div>
    </div>
  );
}
