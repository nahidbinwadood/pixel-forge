import { Prisma, prisma } from "@pixelforge/db";
import { stripeEnabled } from "@/lib/billing/stripe";
import { constructStripeEvent, handleStripeEvent } from "@/lib/billing/webhook";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Verifies the signature, then dedupes on event.id (Stripe retries deliveries) by
 * inserting into WebhookEvent before processing — a unique-constraint failure means "already handled".
 */
export async function POST(req: Request): Promise<Response> {
  if (!stripeEnabled) return new Response("Billing is not enabled", { status: 404 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: ReturnType<typeof constructStripeEvent>;
  try {
    event = constructStripeEvent(body, signature);
  } catch (e) {
    console.warn("[stripe webhook] signature verification failed", e);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ received: true, duplicate: true });
    }
    throw e;
  }

  try {
    await handleStripeEvent(event);
  } catch (e) {
    console.error(`[stripe webhook] handler failed for ${event.type} (${event.id})`, e);
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
