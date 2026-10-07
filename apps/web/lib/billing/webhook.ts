import "server-only";
import { Prisma, prisma } from "@pixelforge/db";
import type Stripe from "stripe";
import { planForPriceId } from "./prices";
import { getStripe } from "./stripe";

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | undefined {
  if (!customer) return undefined;
  return typeof customer === "string" ? customer : customer.id;
}

async function userIdForCustomer(customer: string): Promise<string | undefined> {
  const sub = await prisma.subscription.findUnique({ where: { stripeCustomerId: customer }, select: { userId: true } });
  return sub?.userId;
}

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription): Promise<void> {
  const cust = customerId(sub.customer);
  if (!cust) return;
  const userId = (sub.metadata?.userId as string | undefined) ?? (await userIdForCustomer(cust));
  if (!userId) {
    console.warn(`[stripe webhook] subscription ${sub.id} has no matching user, skipping`);
    return;
  }
  const item = sub.items.data[0];
  const mapped = item ? planForPriceId(item.price.id) : undefined;
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;
  // A canceled/incomplete_expired subscription reads as Free (entitlements.ts also guards on status).
  const planId = sub.status === "canceled" || sub.status === "incomplete_expired" ? "free" : (mapped?.planId ?? "free");

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId,
      status: sub.status,
      currentPeriodEnd: periodEnd,
      stripeCustomerId: cust,
      stripeSubscriptionId: sub.id,
    },
    create: {
      userId,
      planId,
      status: sub.status,
      currentPeriodEnd: periodEnd,
      stripeCustomerId: cust,
      stripeSubscriptionId: sub.id,
    },
  });
}

async function recordCreditPurchase(userId: string, credits: number, dedupeKey: string): Promise<void> {
  if (credits <= 0) return;
  try {
    await prisma.creditLedger.create({ data: { userId, delta: credits, reason: "purchase", dedupeKey } });
  } catch (e) {
    // Unique violation on dedupeKey = already recorded (retried webhook delivery); safe to ignore.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
}

async function recordInvoice(invoice: Stripe.Invoice): Promise<void> {
  const cust = customerId(invoice.customer);
  const userId = cust ? await userIdForCustomer(cust) : undefined;
  if (!userId) return;
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id ?? "" },
    update: {
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status ?? "unknown",
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
    },
    create: {
      userId,
      stripeInvoiceId: invoice.id ?? `invoice_${Date.now()}`,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status ?? "unknown",
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
    },
  });
}

/**
 * Handles one verified Stripe event. Idempotency is the caller's job (insert into WebhookEvent
 * keyed by event.id before calling this, see the webhook route) — Stripe retries deliveries, so the
 * same event id can arrive more than once.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id ?? (session.metadata?.userId as string | undefined);
      if (!userId) break;
      if (session.mode === "payment" && session.metadata?.kind === "credits") {
        const credits = Number(session.metadata.credits ?? 0);
        await recordCreditPurchase(userId, credits, `stripe:checkout:${session.id}`);
      }
      // Subscription checkouts are finalized by the customer.subscription.* event Stripe sends alongside this one.
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertSubscriptionFromStripe(event.data.object);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await recordInvoice(event.data.object);
      break;
    default:
      break;
  }
}

export function constructStripeEvent(body: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return getStripe().webhooks.constructEvent(body, signature, secret);
}
