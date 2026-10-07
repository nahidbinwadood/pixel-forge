import { prisma } from "@pixelforge/db";
import { requireUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/redis";

/**
 * GDPR data export as a JSON download.
 * ponytail: synchronous, not a job (API_SPEC drafts POST + job). Fine while accounts are small;
 * move to a worker job + emailed link when exports get slow or include binary files.
 */
export const GET = route(async () => {
  const user = await requireUser();
  await rateLimit(`export:${user.id}`, 5, 60 * 60);
  const [profile, workspaces, assets, ledger, aiJobs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, locale: true, createdAt: true },
    }),
    prisma.workspace.findMany({
      where: { members: { some: { userId: user.id } } },
      include: { projects: { select: { id: true, name: true, document: true, createdAt: true, updatedAt: true } } },
    }),
    prisma.asset.findMany({
      where: { ownerId: user.id },
      select: { id: true, kind: true, mimeType: true, bytes: true, createdAt: true, license: true },
    }),
    prisma.creditLedger.findMany({
      where: { userId: user.id },
      select: { delta: true, reason: true, createdAt: true },
    }),
    prisma.aIJob.findMany({
      where: { userId: user.id },
      select: { tool: true, input: true, status: true, createdAt: true },
    }),
  ]);
  const body = JSON.stringify({ exportedAt: new Date(), profile, workspaces, assets, ledger, aiJobs }, null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="pixelforge-export-${user.id}.json"`,
    },
  });
});
