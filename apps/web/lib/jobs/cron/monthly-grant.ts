import { prisma } from "@pixelforge/db";
import { PLANS, type PlanId } from "@pixelforge/shared";

/** Same key the signup grant uses (apps/web lib/auth.ts), so a user is topped up at most once per month. */
export const grantKey = (now: Date, userId: string) => `grant:${now.toISOString().slice(0, 7)}:${userId}`;

/** ARCHITECTURE §5: grants don't roll over; top the balance up to the plan amount. */
export const topUpDelta = (monthlyCredits: number, balance: number) => Math.max(0, monthlyCredits - balance);

export interface GrantStore {
  /** Active (not deleted, not banned) users after `afterId`, ordered by id. */
  activeUsers(afterId: string | null, take: number): Promise<{ id: string; planId: string | null }[]>;
  /**
   * In one transaction with the user row locked: skip if `key` exists, else read the balance and insert
   * the grant (delta may be 0, which still marks the month as done). Returns the delta, or null if skipped.
   */
  grantOnce(userId: string, key: string, delta: (balance: number) => number): Promise<number | null>;
}

export const prismaGrantStore: GrantStore = {
  activeUsers: (afterId, take) =>
    prisma.user
      .findMany({
        where: { deletedAt: null, bannedAt: null, ...(afterId ? { id: { gt: afterId } } : {}) },
        orderBy: { id: "asc" },
        take,
        select: { id: true, subscription: { select: { planId: true } } },
      })
      .then((rows) => rows.map((r) => ({ id: r.id, planId: r.subscription?.planId ?? null }))),
  grantOnce: (userId, key, delta) =>
    prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      if (await tx.creditLedger.findUnique({ where: { dedupeKey: key }, select: { id: true } })) return null;
      const sum = await tx.creditLedger.aggregate({ where: { userId }, _sum: { delta: true } });
      const d = delta(sum._sum.delta ?? 0);
      await tx.creditLedger.create({
        data: { userId, delta: d, reason: "monthly_grant", dedupeKey: key, note: "Monthly top-up" },
      });
      return d;
    }),
};

/** Monthly credit top-up (BACKLOG B-15). Safe to run any number of times in a month. */
export async function runMonthlyGrant(store: GrantStore = prismaGrantStore, now = new Date(), batch = 500) {
  let granted = 0;
  let credits = 0;
  let skipped = 0;
  let after: string | null = null;
  for (;;) {
    const users = await store.activeUsers(after, batch);
    if (users.length === 0) break;
    for (const u of users) {
      const plan = PLANS[(u.planId ?? "free") as PlanId] ?? PLANS.free;
      const d = await store.grantOnce(u.id, grantKey(now, u.id), (balance) => topUpDelta(plan.monthlyCredits, balance));
      if (d === null) skipped++;
      else {
        granted++;
        credits += d;
      }
    }
    after = users.at(-1)?.id ?? null;
    if (users.length < batch) break;
  }
  return { granted, credits, skipped };
}
