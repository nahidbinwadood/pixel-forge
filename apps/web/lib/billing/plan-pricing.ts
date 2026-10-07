import type { PlanId } from "@pixelforge/shared";

/**
 * Display prices for the pricing page. Not in packages/shared/src/plans.ts (that file is limits +
 * AI credit costs only, per CLAUDE.md) and not fetched from Stripe (an extra API round-trip for a
 * page that renders rarely). Whoever sets the real STRIPE_PRICE_* env vars must keep these numbers
 * matching the actual Stripe Price objects — see BACKLOG.
 */
export const PLAN_MONTHLY_USD: Partial<Record<PlanId, number>> = {
  plus: 12,
  pro: 29,
  team: 79,
};

/** Yearly billing = 10x monthly (2 months free), matching the "Save" pill on the toggle. */
export function yearlyUsd(monthlyUsd: number): number {
  return monthlyUsd * 10;
}
