import { prisma } from "@pixelforge/db";
import { ApiError, notFound, requireUser, route } from "@/lib/api";
import { uploadsQueue } from "@/lib/redis";
import { deleteObjects, objectSize } from "@/lib/storage";

/** Step 2 of upload: confirm the object landed with the declared size, then hand off to the worker. */
export const POST = route<{ assetId: string }>(async (_req, { assetId }) => {
  const user = await requireUser();
  const asset = await prisma.asset.findFirst({ where: { id: assetId, ownerId: user.id } });
  if (!asset) throw notFound("Upload");
  if (asset.status !== "pending") return Response.json({ id: asset.id, status: asset.status });

  const size = await objectSize(asset.storageKey);
  if (size === null) throw new ApiError(409, "UPLOAD_MISSING", "File has not been uploaded yet");
  if (size !== asset.bytes) {
    await deleteObjects([asset.storageKey]);
    await prisma.asset.update({ where: { id: asset.id }, data: { status: "rejected" } });
    throw new ApiError(422, "UPLOAD_MISMATCH", "Uploaded file does not match the declared size");
  }

  await prisma.asset.update({ where: { id: asset.id }, data: { status: "processing" } });
  await uploadsQueue.add("process", { assetId: asset.id }, { jobId: asset.id });
  return Response.json({ id: asset.id, status: "processing" }, { status: 202 });
});
