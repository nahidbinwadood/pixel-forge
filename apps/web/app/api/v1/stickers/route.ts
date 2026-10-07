import { prisma } from "@pixelforge/db";
import { z } from "zod";
import { route } from "@/lib/api";
import { publicAssetUrl } from "@/lib/templates";

const Query = z.object({
  q: z.string().trim().max(60).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(60),
});

/** Global sticker library (original parametric SVGs — see packages/db/src/seed-content.ts). */
export const GET = route(async (req) => {
  const { q, cursor, limit } = Query.parse(Object.fromEntries(new URL(req.url).searchParams));

  const rows = await prisma.asset.findMany({
    where: {
      kind: "sticker",
      status: "ready",
      ...(q ? { tags: { has: q.toLowerCase() } } : {}),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, limit);

  return Response.json({
    items: page.map((a) => ({ id: a.id, url: publicAssetUrl(a.storageKey), tags: a.tags, premium: a.premium })),
    nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
  });
});
