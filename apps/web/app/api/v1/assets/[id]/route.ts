import { prisma } from "@pixelforge/db";
import { personalWorkspaceId } from "@/lib/account";
import { notFound, requireUser, route } from "@/lib/api";
import { deleteObjects } from "@/lib/storage";

export const DELETE = route<{ id: string }>(async (_req, { id }) => {
  const user = await requireUser();
  const workspaceId = await personalWorkspaceId(user.id);
  const asset = await prisma.asset.findFirst({ where: { id, workspaceId } });
  if (!asset) throw notFound("Asset");

  const variants = Object.values(asset.variants as Record<string, string>);
  await deleteObjects([asset.storageKey, ...variants]);
  await prisma.asset.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
