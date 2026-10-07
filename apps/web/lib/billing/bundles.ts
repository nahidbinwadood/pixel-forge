import "server-only";

export interface CreditBundle {
  id: "starter" | "pro" | "studio";
  credits: number;
  priceUsd: number;
}

/**
 * Credit bundle sizing/pricing. Not in packages/shared/src/plans.ts (plan limits + AI job costs only,
 * per CLAUDE.md) — candidate to move there if a second consumer needs it (see BACKLOG).
 */
export const CREDIT_BUNDLES: readonly CreditBundle[] = [
  { id: "starter", credits: 100, priceUsd: 5 },
  { id: "pro", credits: 500, priceUsd: 20 },
  { id: "studio", credits: 2000, priceUsd: 70 },
];

export function findBundle(id: string): CreditBundle | undefined {
  return CREDIT_BUNDLES.find((b) => b.id === id);
}

/** `STRIPE_PRICE_CREDITS_STARTER`, etc. */
export function bundlePriceId(id: CreditBundle["id"]): string | undefined {
  return process.env[`STRIPE_PRICE_CREDITS_${id.toUpperCase()}`];
}
