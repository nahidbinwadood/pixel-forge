import { prisma } from "@pixelforge/db";
import { assetKeys, deleteKeys } from "../ai/storage";

export const PURGE_AFTER_DAYS = 30;

export interface PurgeStore {
  dueUsers(cutoff: Date, take: number): Promise<string[]>;
  /** Storage keys of every asset in workspaces that disappear with the user (personal, sole member). */
  storageKeys(userId: string): Promise<string[]>;
  /** Deletes those workspaces (cascading projects/assets/folders), then the user (cascading the rest). */
  deleteUser(userId: string): Promise<void>;
  deleteKeys(keys: string[]): Promise<void>;
}

const ownedWorkspaces = (userId: string) => ({
  personal: true,
  members: { every: { userId } },
});

export const prismaPurgeStore: PurgeStore = {
  dueUsers: (cutoff, take) =>
    prisma.user
      .findMany({ where: { deletedAt: { lt: cutoff } }, select: { id: true }, take, orderBy: { deletedAt: "asc" } })
      .then((r) => r.map((u) => u.id)),
  storageKeys: async (userId) => {
    const assets = await prisma.asset.findMany({
      where: { workspace: ownedWorkspaces(userId) },
      select: { storageKey: true, variants: true },
    });
    return assets.flatMap(assetKeys);
  },
  deleteUser: async (userId) => {
    await prisma.$transaction([
      prisma.workspace.deleteMany({ where: { ...ownedWorkspaces(userId), members: { some: { userId } } } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
  },
  deleteKeys,
};

/**
 * GDPR hard delete (BACKLOG B-10): users soft-deleted more than 30 days ago lose their rows and files.
 * Idempotent: a purged user is gone, so a re-run finds nothing. Files go first so a crash never leaves
 * orphaned objects without a DB row pointing at them.
 */
export async function runPurgeDeletedUsers(store: PurgeStore = prismaPurgeStore, now = new Date(), batch = 100) {
  const cutoff = new Date(now.getTime() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  let purged = 0;
  const failed: string[] = [];
  for (const userId of await store.dueUsers(cutoff, batch)) {
    try {
      await store.deleteKeys(await store.storageKeys(userId));
      await store.deleteUser(userId);
      purged++;
    } catch (e) {
      // e.g. projects in a shared team workspace still reference the user; leave for manual review.
      failed.push(userId);
      console.error(`[cron] purge ${userId} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return { purged, failed };
}
