import { prisma } from "@pixelforge/db";
import { z } from "zod";
import { personalWorkspaceId } from "@/lib/account";
import { requireUser, route } from "@/lib/api";
import { presignGet } from "@/lib/storage";

const Query = z.object({
  kind: z.enum(["upload", "ai_output", "export"]).default("upload"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

type Variants = { thumb?: string; preview?: string };

export const GET = route(async (req) => {
  const user = await requireUser();
  const { kind, cursor, limit } = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const workspaceId = await personalWorkspaceId(user.id);

  const rows = await prisma.asset.findMany({
    where: { workspaceId, kind, status: { in: ["processing", "ready"] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, limit);

  const items = await Promise.all(
    page.map(async (a) => {
      const v = a.variants as Variants;
      return {
        id: a.id,
        kind: a.kind,
        status: a.status,
        mimeType: a.mimeType,
        bytes: a.bytes,
        width: a.width,
        height: a.height,
        name: (a.license as { filename?: string } | null)?.filename ?? null,
        createdAt: a.createdAt,
        thumbUrl: v.thumb ? await presignGet(v.thumb) : null,
        previewUrl: v.preview ? await presignGet(v.preview) : null,
      };
    }),
  );
  return Response.json({ items, nextCursor: rows.length > limit ? page.at(-1)?.id : null });
});
