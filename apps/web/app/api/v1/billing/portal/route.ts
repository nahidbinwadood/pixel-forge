import { requireUser, route } from "@/lib/api";
import { createPortalSession } from "@/lib/billing/checkout";
import { rateLimit } from "@/lib/rate-limit";

/** Creates a Stripe customer-portal session (manage payment method, cancel, invoices). */
export const POST = route(async () => {
  const user = await requireUser();
  await rateLimit(`billing:portal:${user.id}`, 10, 60);
  const url = await createPortalSession(user.id);
  return Response.json({ url });
});
