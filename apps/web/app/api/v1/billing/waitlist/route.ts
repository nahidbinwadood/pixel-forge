import { prisma } from "@pixelforge/db";
import { PLANS, type PlanId } from "@pixelforge/shared";
import { z } from "zod";
import { ApiError, parseJson, route } from "@/lib/api";
import { rateLimit } from "@/lib/redis";

const planIds = Object.keys(PLANS) as [PlanId, ...PlanId[]];

const schema = z
  .object({
    email: z.email().max(254),
    planId: z.enum(planIds).optional(),
    source: z.string().trim().max(60).optional(),
  })
  .strict();

/** Public, rate-limited. Stores interest in a plan while Stripe prices aren't configured for it yet. */
export const POST = route(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await rateLimit(`billing:waitlist:${ip}`, 5, 60);
  const input = await parseJson(req, schema);

  try {
    await prisma.waitlistEntry.create({
      data: { email: input.email, planId: input.planId ?? null, source: input.source ?? null },
    });
  } catch (e) {
    // Unique email: treat a repeat signup as a success, not an error.
    if (!(e instanceof Error) || !("code" in e) || (e as { code?: string }).code !== "P2002") {
      throw e instanceof ApiError ? e : new ApiError(500, "INTERNAL", "Could not save your email");
    }
  }
  return Response.json({ ok: true });
});
