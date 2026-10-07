import "server-only";
import { prisma } from "@pixelforge/db";
import { PLANS, type PlanId } from "@pixelforge/shared";

export async function personalWorkspaceId(userId: string): Promise<string> {
  const m = await prisma.membership.findFirst({
    where: { userId, workspace: { personal: true } },
    select: { workspaceId: true },
  });
  if (!m) throw new Error(`user ${userId} has no personal workspace`);
  return m.workspaceId;
}

export async function creditBalance(userId: string): Promise<number> {
  const r = await prisma.creditLedger.aggregate({ where: { userId }, _sum: { delta: true } });
  return r._sum.delta ?? 0;
}

export async function userPlan(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: { planId: true } });
  return PLANS[(sub?.planId ?? "free") as PlanId] ?? PLANS.free;
}
