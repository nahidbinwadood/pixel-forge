import "server-only";
import { prisma } from "@pixelforge/db";
import { PLANS, type Plan, type PlanId } from "@pixelforge/shared";

export interface Entitlements extends Plan {
  status: string;
  isPaid: boolean;
  currentPeriodEnd: Date | null;
}

/**
 * Plan + limits for gates (ARCHITECTURE §5), aware of Stripe subscription status: a lapsed
 * subscription (`past_due`, `canceled`, …) reads as Free even if `planId` hasn't been reset yet by
 * the webhook. `lib/account.ts`'s `userPlan()` stays the simple admin-set-only lookup other code uses.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const active = sub?.status === "active" || sub?.status === "trialing";
  const planId = active ? ((sub?.planId ?? "free") as PlanId) : "free";
  const plan = PLANS[planId] ?? PLANS.free;
  return {
    ...plan,
    status: sub?.status ?? "active",
    isPaid: planId !== "free",
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
  };
}
