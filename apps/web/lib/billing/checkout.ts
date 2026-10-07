import "server-only";
import { prisma } from "@pixelforge/db";
import { ApiError } from "@/lib/api";
import { bundlePriceId, findBundle } from "./bundles";
import { planPriceId } from "./prices";
import { getStripe, stripeEnabled } from "./stripe";
import type { BillingInterval } from "./prices";
import type { PlanId } from "@pixelforge/shared";

async function ensureCustomerId(userId: string, email: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: { stripeCustomerId: true } });
  if (sub?.stripeCustomerId) return sub.stripeCustomerId;
  const customer = await getStripe().customers.create({ email, metadata: { userId } });
  await prisma.subscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customer.id },
    create: { userId, stripeCustomerId: customer.id },
  });
  return customer.id;
}

function appUrl(path: string): string {
  return `${process.env.APP_URL ?? "http://localhost:3000"}${path}`;
}

export async function createPlanCheckout(args: {
  userId: string;
  email: string;
  planId: PlanId;
  interval: BillingInterval;
}): Promise<string> {
  if (!stripeEnabled) throw new ApiError(409, "BILLING_DISABLED", "Billing isn't enabled yet — join the waitlist");
  const price = planPriceId(args.planId, args.interval);
  if (!price) throw new ApiError(404, "PRICE_NOT_CONFIGURED", "This plan isn't available for purchase yet");
  const customer = await ensureCustomerId(args.userId, args.email);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    success_url: appUrl("/settings?billing=success"),
    cancel_url: appUrl("/pricing?billing=canceled"),
    client_reference_id: args.userId,
    subscription_data: { metadata: { userId: args.userId } },
  });
  if (!session.url) throw new ApiError(500, "INTERNAL", "Stripe did not return a checkout URL");
  return session.url;
}

export async function createCreditBundleCheckout(args: {
  userId: string;
  email: string;
  bundleId: string;
}): Promise<string> {
  if (!stripeEnabled) throw new ApiError(409, "BILLING_DISABLED", "Billing isn't enabled yet — join the waitlist");
  const bundle = findBundle(args.bundleId);
  if (!bundle) throw new ApiError(404, "NOT_FOUND", "Unknown credit bundle");
  const price = bundlePriceId(bundle.id);
  if (!price) throw new ApiError(404, "PRICE_NOT_CONFIGURED", "This bundle isn't available for purchase yet");
  const customer = await ensureCustomerId(args.userId, args.email);
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer,
    line_items: [{ price, quantity: 1 }],
    success_url: appUrl("/settings?billing=success"),
    cancel_url: appUrl("/pricing?billing=canceled"),
    client_reference_id: args.userId,
    metadata: { userId: args.userId, kind: "credits", bundleId: bundle.id, credits: String(bundle.credits) },
  });
  if (!session.url) throw new ApiError(500, "INTERNAL", "Stripe did not return a checkout URL");
  return session.url;
}

export async function createPortalSession(userId: string): Promise<string> {
  if (!stripeEnabled) throw new ApiError(409, "BILLING_DISABLED", "Billing isn't enabled yet");
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: { stripeCustomerId: true } });
  if (!sub?.stripeCustomerId) throw new ApiError(404, "NO_CUSTOMER", "No billing account yet");
  const session = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: appUrl("/settings"),
  });
  return session.url;
}
