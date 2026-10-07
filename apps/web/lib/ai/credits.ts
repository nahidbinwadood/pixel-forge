import "server-only";
import { prisma } from "@pixelforge/db";

export interface LedgerEntry {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  jobId: string | null;
  tool: string | null;
  createdAt: string;
}

/** Usage history, newest first. Zero-delta rows (a top-up that found the balance already full) are hidden. */
export async function listLedger(
  userId: string,
  opts: { cursor?: string; limit: number },
): Promise<{ items: LedgerEntry[]; nextCursor: string | null }> {
  const rows = await prisma.creditLedger.findMany({
    where: { userId, delta: { not: 0 } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: opts.limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    include: { job: { select: { tool: true } } },
  });
  const page = rows.slice(0, opts.limit);
  return {
    items: page.map((r) => ({
      id: r.id,
      delta: r.delta,
      reason: r.reason,
      note: r.note,
      jobId: r.jobId,
      tool: r.job?.tool ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor: rows.length > opts.limit ? (page.at(-1)?.id ?? null) : null,
  };
}
