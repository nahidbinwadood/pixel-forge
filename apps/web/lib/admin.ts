"use server";

import { randomUUID } from "node:crypto";
import { Prisma, prisma } from "@pixelforge/db";
import { PLANS, type PlanId } from "@pixelforge/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "./api";
import { clearFlagCache } from "./flags";

/** Result shape for client toasts. Server actions never throw raw errors at the UI. */
type Result = { ok: true } | { ok: false; error: string };

const userId = z.string().min(1).max(64);
const planIds = Object.keys(PLANS) as [PlanId, ...PlanId[]];

async function run(fn: (adminId: string) => Promise<void>, path: string): Promise<Result> {
  try {
    const admin = await requireUser({ admin: true });
    await fn(admin.id);
    revalidatePath(path);
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input" };
    if (e instanceof Error) return { ok: false, error: e.message };
    return { ok: false, error: "Something went wrong" };
  }
}

function audit(actorId: string, action: string, targetType: string, targetId: string, meta: Prisma.InputJsonValue) {
  return prisma.auditLog.create({ data: { actorId, action, targetType, targetId, meta } });
}

export async function setRole(id: string, role: string): Promise<Result> {
  return run(async (adminId) => {
    const input = z.object({ id: userId, role: z.enum(["user", "admin"]) }).parse({ id, role });
    if (input.id === adminId && input.role !== "admin") throw new Error("You can't demote yourself");
    const before = await prisma.user.findUniqueOrThrow({ where: { id: input.id }, select: { role: true } });
    await prisma.$transaction([
      prisma.user.update({ where: { id: input.id }, data: { role: input.role } }),
      audit(adminId, "admin.set_role", "user", input.id, { before: before.role, after: input.role }),
    ]);
  }, "/admin");
}

export async function setPlan(id: string, planId: string): Promise<Result> {
  return run(async (adminId) => {
    const input = z.object({ id: userId, planId: z.enum(planIds) }).parse({ id, planId });
    const before = await prisma.subscription.findUnique({ where: { userId: input.id }, select: { planId: true } });
    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId: input.id },
        update: { planId: input.planId },
        create: { userId: input.id, planId: input.planId },
      }),
      audit(adminId, "admin.set_plan", "user", input.id, { before: before?.planId ?? null, after: input.planId }),
    ]);
  }, "/admin");
}

export async function grantCredits(id: string, amount: number, note: string): Promise<Result> {
  return run(async (adminId) => {
    const input = z
      .object({
        id: userId,
        amount: z
          .number()
          .int()
          .min(-10_000)
          .max(10_000)
          .refine((n) => n !== 0, "Amount must be non-zero"),
        note: z.string().trim().max(200),
      })
      .parse({ id, amount, note });
    await prisma.user.findUniqueOrThrow({ where: { id: input.id }, select: { id: true } });
    await prisma.$transaction([
      prisma.creditLedger.create({
        data: {
          userId: input.id,
          delta: input.amount,
          reason: "admin_grant",
          note: input.note || null,
          dedupeKey: `admin:${randomUUID()}`,
        },
      }),
      audit(adminId, "admin.credit_grant", "user", input.id, { amount: input.amount, note: input.note }),
    ]);
  }, "/admin");
}

export async function setBanned(id: string, banned: boolean): Promise<Result> {
  return run(async (adminId) => {
    const input = z.object({ id: userId, banned: z.boolean() }).parse({ id, banned });
    if (input.id === adminId) throw new Error("You can't ban yourself");
    const before = await prisma.user.findUniqueOrThrow({ where: { id: input.id }, select: { bannedAt: true } });
    await prisma.$transaction([
      prisma.user.update({ where: { id: input.id }, data: { bannedAt: input.banned ? new Date() : null } }),
      // Revoke sessions so the ban takes effect immediately (requireUser trusts live sessions).
      ...(input.banned ? [prisma.session.deleteMany({ where: { userId: input.id } })] : []),
      audit(adminId, input.banned ? "admin.ban" : "admin.unban", "user", input.id, {
        before: before.bannedAt?.toISOString() ?? null,
        after: input.banned,
      }),
    ]);
  }, "/admin");
}

const Rules = z
  .object({
    userIds: z.array(z.string().min(1)).optional(),
    roles: z.array(z.string().min(1)).optional(),
    percent: z.number().min(0).max(100).optional(),
  })
  .strict()
  .nullable();

const flagKey = z.string().regex(/^[a-z0-9_.-]{2,64}$/, "Key must be 2-64 chars: a-z 0-9 _ . -");

export async function updateFlag(key: string, enabled: boolean, rules: unknown): Promise<Result> {
  return run(async (adminId) => {
    const input = z.object({ key: flagKey, enabled: z.boolean(), rules: Rules }).parse({ key, enabled, rules });
    const before = await prisma.featureFlag.findUniqueOrThrow({ where: { key: input.key } });
    await prisma.$transaction([
      prisma.featureFlag.update({
        where: { key: input.key },
        data: { enabled: input.enabled, rules: input.rules ?? Prisma.DbNull },
      }),
      audit(adminId, "admin.flag_update", "flag", input.key, {
        before: { enabled: before.enabled, rules: before.rules } as Prisma.InputJsonValue,
        after: { enabled: input.enabled, rules: input.rules } as Prisma.InputJsonValue,
      }),
    ]);
    clearFlagCache();
  }, "/admin/flags");
}

export async function createFlag(key: string, description: string): Promise<Result> {
  return run(async (adminId) => {
    const input = z.object({ key: flagKey, description: z.string().trim().max(200) }).parse({ key, description });
    if (await prisma.featureFlag.findUnique({ where: { key: input.key } })) throw new Error("Flag already exists");
    await prisma.$transaction([
      prisma.featureFlag.create({ data: { key: input.key, description: input.description || null } }),
      audit(adminId, "admin.flag_create", "flag", input.key, { description: input.description }),
    ]);
    clearFlagCache();
  }, "/admin/flags");
}
