import { PLANS, type PlanId } from "@pixelforge/shared";

export type BillingInterval = "monthly" | "yearly";

const PAID_PLANS = (Object.keys(PLANS) as PlanId[]).filter((id) => id !== "free");

/** `STRIPE_PRICE_PLUS_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, … — set only for plans actually sold. */
export function planPriceId(planId: PlanId, interval: BillingInterval): string | undefined {
  return process.env[`STRIPE_PRICE_${planId.toUpperCase()}_${interval.toUpperCase()}`];
}

/** True once at least one paid plan/interval has a Stripe price configured. */
export function hasAnyPlanPrice(): boolean {
  return PAID_PLANS.some((id) => planPriceId(id, "monthly") || planPriceId(id, "yearly"));
}

/** Reverse lookup used by the webhook handler to turn a Stripe price id back into a plan. */
export function planForPriceId(priceId: string): { planId: PlanId; interval: BillingInterval } | undefined {
  for (const planId of PAID_PLANS) {
    for (const interval of ["monthly", "yearly"] as const) {
      if (planPriceId(planId, interval) === priceId) return { planId, interval };
    }
  }
  return undefined;
}
