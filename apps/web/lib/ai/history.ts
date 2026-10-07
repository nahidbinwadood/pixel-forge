import "server-only";
import { prisma } from "@pixelforge/db";
import type { AIJobOutput, AITool } from "@pixelforge/shared";
import { personalWorkspaceId } from "../account";
import { presignGet } from "../storage";
import { historySummary } from "./summary";

export interface HistoryItem {
  id: string;
  tool: AITool;
  status: string;
  summary: string;
  costCredits: number;
  favorite: boolean;
  thumbUrl: string | null;
  createdAt: string;
}

/** The caller's AI jobs, newest first. Cursor = last job id. */
export async function listHistory(
  userId: string,
  opts: { tool?: AITool; favoritesOnly?: boolean; cursor?: string; limit: number },
): Promise<{ items: HistoryItem[]; nextCursor: string | null }> {
  const favs = await prisma.favorite.findMany({
    where: { userId, targetType: "ai_job" },
    select: { targetId: true },
  });
  const favIds = new Set(favs.map((f) => f.targetId));

  const rows = await prisma.aIJob.findMany({
    where: {
      userId,
      ...(opts.tool ? { tool: opts.tool } : {}),
      ...(opts.favoritesOnly ? { id: { in: [...favIds] } } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: opts.limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, opts.limit);

  // One query for every first-output thumbnail on the page, scoped to the user's workspace.
  const firstAsset = new Map<string, string>();
  for (const r of page) {
    const out = r.output as AIJobOutput | null;
    const id = out && "assetIds" in out ? out.assetIds[0] : undefined;
    if (id) firstAsset.set(r.id, id);
  }
  const workspaceId = firstAsset.size ? await personalWorkspaceId(userId) : null;
  const assets = workspaceId
    ? await prisma.asset.findMany({
        where: { id: { in: [...firstAsset.values()] }, workspaceId },
        select: { id: true, variants: true },
      })
    : [];
  const thumbs = new Map(assets.map((a) => [a.id, (a.variants as { thumb?: string }).thumb]));

  const items = await Promise.all(
    page.map(async (r) => {
      const assetId = firstAsset.get(r.id);
      const thumbKey = assetId ? thumbs.get(assetId) : undefined;
      return {
        id: r.id,
        tool: r.tool as AITool,
        status: r.status,
        summary: historySummary(r.tool, r.input),
        costCredits: r.costCredits,
        favorite: favIds.has(r.id),
        thumbUrl: thumbKey ? await presignGet(thumbKey) : null,
        createdAt: r.createdAt.toISOString(),
      };
    }),
  );
  return { items, nextCursor: rows.length > opts.limit ? (page.at(-1)?.id ?? null) : null };
}
