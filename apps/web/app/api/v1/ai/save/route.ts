import { prisma } from "@pixelforge/db";
import { z } from "zod";
import { personalWorkspaceId } from "@/lib/account";
import { track } from "@/lib/analytics";
import { notFound, parseJson, requireUser, route } from "@/lib/api";

const Body = z.object({ assetId: z.string().min(1).max(64) });

/**
 * Save an AI result to the user's library (Uploads). The asset moves from `ai_output` to `upload` and keeps
 * its AI provenance in `license`. Idempotent: saving twice is a no-op.
 */
export const POST = route(async (req) => {
  const user = await requireUser();
  const { assetId } = await parseJson(req, Body);
  const workspaceId = await personalWorkspaceId(user.id);
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, workspaceId, status: "ready", kind: { in: ["ai_output", "upload"] } },
    select: { id: true, kind: true, license: true, tags: true },
  });
  if (!asset) throw notFound("Image");
  if (asset.kind === "ai_output") {
    const license = (asset.license ?? {}) as Record<string, unknown>;
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        kind: "upload",
        tags: [...new Set([...asset.tags, "ai"])],
        license: { ...license, filename: (license.filename as string | undefined) ?? "AI image.png" },
      },
    });
    track("ai_result_saved", {}, user.id);
  }
  return Response.json({ assetId: asset.id, saved: true });
});
