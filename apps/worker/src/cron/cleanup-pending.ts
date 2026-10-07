import { prisma } from "@pixelforge/db";
import { assetKeys, deleteKeys } from "../ai/storage";

export const PENDING_TTL_HOURS = 24;

export interface PendingStore {
  stale(cutoff: Date, take: number): Promise<{ id: string; storageKey: string; variants: unknown }[]>;
  deleteAssets(ids: string[], cutoff: Date): Promise<number>;
  deleteKeys(keys: string[]): Promise<void>;
}

export const prismaPendingStore: PendingStore = {
  stale: (cutoff, take) =>
    prisma.asset.findMany({
      where: { status: "pending", createdAt: { lt: cutoff } },
      select: { id: true, storageKey: true, variants: true },
      take,
    }),
  // Re-check status so an upload completed between select and delete is kept.
  deleteAssets: (ids, cutoff) =>
    prisma.asset
      .deleteMany({ where: { id: { in: ids }, status: "pending", createdAt: { lt: cutoff } } })
      .then((r) => r.count),
  deleteKeys,
};

/** BACKLOG B-11: presigned uploads never completed within 24 h are removed (row + any partial object). */
export async function runCleanupPendingAssets(store: PendingStore = prismaPendingStore, now = new Date(), batch = 500) {
  const cutoff = new Date(now.getTime() - PENDING_TTL_HOURS * 60 * 60 * 1000);
  let deleted = 0;
  for (;;) {
    const rows = await store.stale(cutoff, batch);
    if (rows.length === 0) break;
    await store.deleteKeys(rows.flatMap(assetKeys));
    const n = await store.deleteAssets(
      rows.map((r) => r.id),
      cutoff,
    );
    deleted += n;
    if (rows.length < batch || n === 0) break;
  }
  return { deleted };
}
