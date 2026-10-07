import { randomUUID } from "node:crypto";
import { prisma } from "@pixelforge/db";
import { storageKeys, UPLOAD_MIME_TYPES } from "@pixelforge/shared";
import { z } from "zod";
import { personalWorkspaceId, userPlan } from "@/lib/account";
import { ApiError, parseJson, requireUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { presignPut } from "@/lib/storage";

const MB = 1024 * 1024;

const Body = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.enum(UPLOAD_MIME_TYPES),
  bytes: z.number().int().positive(),
});

/** Step 1 of upload: validate limits, create a pending Asset, return a presigned PUT URL. */
export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit(`upload:${user.id}`, 100, 60 * 60);
  const { filename, mimeType, bytes } = await parseJson(req, Body);

  const plan = await userPlan(user.id);
  if (bytes > plan.maxUploadMb * MB) {
    throw new ApiError(413, "FILE_TOO_LARGE", `Files must be ${plan.maxUploadMb} MB or smaller`);
  }
  const workspaceId = await personalWorkspaceId(user.id);
  const used = await prisma.asset.aggregate({
    where: { workspaceId, status: { not: "rejected" } },
    _sum: { bytes: true },
  });
  if ((used._sum.bytes ?? 0) + bytes > plan.storageMb * MB) {
    throw new ApiError(413, "STORAGE_FULL", "Your storage is full. Delete some uploads to make room.");
  }

  const id = randomUUID();
  const storageKey = storageKeys.original(workspaceId, id);
  await prisma.asset.create({
    data: {
      id,
      workspaceId,
      ownerId: user.id,
      kind: "upload",
      status: "pending",
      storageKey,
      mimeType,
      bytes,
      license: { source: "user", filename },
    },
  });
  const uploadUrl = await presignPut(storageKey, mimeType, bytes);
  return Response.json({ assetId: id, uploadUrl, headers: { "Content-Type": mimeType } }, { status: 201 });
});
