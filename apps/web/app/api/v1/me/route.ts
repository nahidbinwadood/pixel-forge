import { prisma } from "@pixelforge/db";
import { z } from "zod";
import { creditBalance, userPlan } from "@/lib/account";
import { parseJson, requireUser, route } from "@/lib/api";

export const GET = route(async () => {
  const user = await requireUser();
  const [plan, credits] = await Promise.all([userPlan(user.id), creditBalance(user.id)]);
  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    locale: user.locale,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled ?? false,
    plan: plan.id,
    credits,
  });
});

const Patch = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(["en"]).optional(), // more locales as messages/*.json land
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  const data = await parseJson(req, Patch);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, locale: true },
  });
  return Response.json(updated);
});

/** GDPR delete: soft-delete now, revoke all sessions; a purge job hard-deletes after 30 days (BACKLOG B-10). */
export const DELETE = route(async () => {
  const user = await requireUser();
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.auditLog.create({
      data: { actorId: user.id, action: "user.delete_requested", targetType: "user", targetId: user.id },
    }),
  ]);
  return new Response(null, { status: 204 });
});
