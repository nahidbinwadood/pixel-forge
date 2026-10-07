import { PLANS } from "@pixelforge/shared";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { getUser } from "@/lib/api";
import { CREDIT_BUNDLES } from "@/lib/billing/bundles";
import { PLAN_MONTHLY_USD } from "@/lib/billing/plan-pricing";
import { planPriceId } from "@/lib/billing/prices";
import { stripeEnabled } from "@/lib/billing/stripe";
import { ComparisonTable } from "./_components/comparison-table";
import { CreditBundles } from "./_components/credit-bundles";
import { PricingFaq } from "./_components/pricing-faq";
import type { PricingPlanRow } from "./_components/pricing-plans";
import { PricingPlans } from "./_components/pricing-plans";
import { WaitlistSection } from "./_components/waitlist-section";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple PixelForge pricing: a generous free plan, and paid plans for heavier AI use and bigger exports.",
  openGraph: { title: "Pricing · PixelForge", description: "Simple, honest pricing." },
};

const PAID_PLAN_IDS = ["plus", "pro", "team"] as const;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, t, sp] = await Promise.all([getUser(), getTranslations("billing.pricing"), searchParams]);

  const plans: PricingPlanRow[] = PAID_PLAN_IDS.map((id) => ({
    id,
    name: PLANS[id].name,
    monthlyCredits: PLANS[id].monthlyCredits,
    monthlyUsd: PLAN_MONTHLY_USD[id] ?? 0,
    monthlyAvailable: stripeEnabled && Boolean(planPriceId(id, "monthly")),
    yearlyAvailable: stripeEnabled && Boolean(planPriceId(id, "yearly")),
  }));

  const billingParam = Array.isArray(sp.billing) ? sp.billing[0] : sp.billing;
  const statusMessage =
    billingParam === "success" ? t("status.success") : billingParam === "canceled" ? t("status.canceled") : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h1 className="text-display">{t("title")}</h1>
        <p className="mt-4 text-lg text-text-2">{t("subtitle")}</p>
      </Reveal>

      {statusMessage && (
        <p role="status" className="mx-auto mt-6 max-w-md rounded-xl border bg-card px-4 py-3 text-center text-sm">
          {statusMessage}
        </p>
      )}

      <div className="mt-12">
        <PricingPlans plans={plans} isSignedIn={Boolean(user)} freeCredits={PLANS.free.monthlyCredits} />
      </div>

      <div className="mt-24">
        <ComparisonTable />
      </div>

      <div className="mt-24">
        <CreditBundles bundles={CREDIT_BUNDLES} stripeEnabled={stripeEnabled} isSignedIn={Boolean(user)} />
      </div>

      <div className="mt-24">
        <PricingFaq />
      </div>

      <div id="waitlist" className="mt-24 scroll-mt-24">
        <WaitlistSection />
      </div>
    </div>
  );
}
