import { PLANS, type PlanId } from "@pixelforge/shared";
import { z } from "zod";
import { parseJson, requireUser, route } from "@/lib/api";
import { createCreditBundleCheckout, createPlanCheckout } from "@/lib/billing/checkout";
import { rateLimit } from "@/lib/rate-limit";

const paidPlanIds = (Object.keys(PLANS) as PlanId[]).filter((id) => id !== "free") as [PlanId, ...PlanId[]];

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plan"), planId: z.enum(paidPlanIds), interval: z.enum(["monthly", "yearly"]) }).strict(),
  z.object({ kind: z.literal("credits"), bundleId: z.enum(["starter", "pro", "studio"]) }).strict(),
]);

/** Creates a Stripe Checkout session for a plan subscription or a one-off credit bundle. */
export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit(`billing:checkout:${user.id}`, 10, 60);
  const input = await parseJson(req, schema);

  const url =
    input.kind === "plan"
      ? await createPlanCheckout({ userId: user.id, email: user.email, planId: input.planId, interval: input.interval })
      : await createCreditBundleCheckout({ userId: user.id, email: user.email, bundleId: input.bundleId });

  return Response.json({ url });
});
