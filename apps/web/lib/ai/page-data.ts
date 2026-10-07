import "server-only";
import { prisma } from "@pixelforge/db";
import type { AITool } from "@pixelforge/shared";
import { creditBalance, personalWorkspaceId, userPlan } from "../account";
import { presignGet } from "../storage";
import { type HistoryItem, listHistory } from "./history";
import { aiStatus } from "./provider";
import { nextRefillDate } from "./summary";

export interface CreditsInfo {
  balance: number;
  allowance: number;
  refillDate: string;
}

export async function creditsInfo(userId: string): Promise<CreditsInfo> {
  const [balance, plan] = await Promise.all([creditBalance(userId), userPlan(userId)]);
  return { balance, allowance: plan.monthlyCredits, refillDate: nextRefillDate().toISOString() };
}

/** Everything a tool page needs on first paint, fetched in parallel. */
export async function toolPageData(userId: string, tool: AITool) {
  const [credits, history] = await Promise.all([creditsInfo(userId), listHistory(userId, { tool, limit: 12 })]);
  return { credits, history: history.items as HistoryItem[], nextCursor: history.nextCursor, status: aiStatus() };
}

export interface PickableImage {
  id: string;
  name: string;
  thumbUrl: string | null;
}

/** Recent ready uploads for the background remover picker. */
export async function pickableUploads(userId: string, take = 24): Promise<PickableImage[]> {
  const workspaceId = await personalWorkspaceId(userId);
  const rows = await prisma.asset.findMany({
    where: { workspaceId, kind: "upload", status: "ready" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: { id: true, variants: true, license: true },
  });
  return Promise.all(
    rows.map(async (a) => {
      const thumb = (a.variants as { thumb?: string }).thumb;
      return {
        id: a.id,
        name: (a.license as { filename?: string } | null)?.filename ?? "",
        thumbUrl: thumb ? await presignGet(thumb) : null,
      };
    }),
  );
}
