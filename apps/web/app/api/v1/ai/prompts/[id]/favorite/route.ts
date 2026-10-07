import { prisma } from "@pixelforge/db";
import { getOwnJob } from "@/lib/ai/jobs";
import { requireUser, route } from "@/lib/api";

const key = (userId: string, targetId: string) => ({
  userId_targetType_targetId: { userId, targetType: "ai_job", targetId },
});

/** Favorite a past prompt (idempotent). */
export const PUT = route<{ id: string }>(async (_req, { id }) => {
  const user = await requireUser();
  await getOwnJob(user.id, id);
  await prisma.favorite.upsert({
    where: key(user.id, id),
    update: {},
    create: { userId: user.id, targetType: "ai_job", targetId: id },
  });
  return Response.json({ favorite: true });
});

export const DELETE = route<{ id: string }>(async (_req, { id }) => {
  const user = await requireUser();
  await prisma.favorite.deleteMany({ where: { userId: user.id, targetType: "ai_job", targetId: id } });
  return Response.json({ favorite: false });
});
