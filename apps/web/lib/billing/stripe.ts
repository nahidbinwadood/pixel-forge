import "server-only";
import Stripe from "stripe";

/** Billing degrades to the waitlist everywhere a key isn't configured (ASSUMPTIONS: Stripe arrives "with keys"). */
export const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

const g = globalThis as unknown as { stripe?: Stripe };

/** Throws if called without STRIPE_SECRET_KEY — callers must check `stripeEnabled` first. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY unset)");
  if (!g.stripe) g.stripe = new Stripe(key);
  return g.stripe;
}
