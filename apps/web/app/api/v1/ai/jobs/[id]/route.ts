import { prisma } from "@pixelforge/db";
import { getOwnJob, serializeJob } from "@/lib/ai/jobs";
import { requireUser, route } from "@/lib/api";

/** Polled every ~1.5 s while a job runs (ASSUMPTIONS D11). Scoped to the caller's own jobs. */
export const GET = route<{ id: string }>(async (_req, { id }) => {
  const user = await requireUser();
  const job = await getOwnJob(user.id, id);
  const fav = await prisma.favorite.findUnique({
    where: { userId_targetType_targetId: { userId: user.id, targetType: "ai_job", targetId: id } },
    select: { userId: true },
  });
  return Response.json(await serializeJob(job, { favorite: Boolean(fav) }));
});
