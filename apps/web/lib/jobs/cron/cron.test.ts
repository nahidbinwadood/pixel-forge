import { describe, expect, it } from "vitest";
import { runCleanupPendingAssets } from "./cleanup-pending";
import { type GrantStore, grantKey, runMonthlyGrant, topUpDelta } from "./monthly-grant";
import { runPurgeDeletedUsers } from "./purge-users";

const NOW = new Date("2026-11-01T00:05:00Z");

describe("monthly grant", () => {
  it("tops up to the plan amount, never down", () => {
    expect(topUpDelta(30, 4)).toBe(26);
    expect(topUpDelta(30, 30)).toBe(0);
    expect(topUpDelta(30, 120)).toBe(0);
  });

  it("uses the month-scoped key shared with the signup grant", () => {
    expect(grantKey(NOW, "u1")).toBe("grant:2026-11:u1");
  });

  /** In-memory store mirroring the Prisma implementation's dedupe semantics. */
  function fakeStore(users: { id: string; planId: string | null; balance: number }[]) {
    const ledger = new Map<string, number>();
    const store: GrantStore = {
      async activeUsers(afterId, take) {
        return users.filter((u) => afterId === null || u.id > afterId).slice(0, take);
      },
      async grantOnce(userId, key, delta) {
        if (ledger.has(key)) return null;
        const u = users.find((x) => x.id === userId);
        const d = delta(u?.balance ?? 0);
        ledger.set(key, d);
        if (u) u.balance += d;
        return d;
      },
    };
    return { store, ledger, users };
  }

  it("grants per plan across batches and is idempotent", async () => {
    const { store, users } = fakeStore([
      { id: "a", planId: null, balance: 5 },
      { id: "b", planId: "plus", balance: 0 },
      { id: "c", planId: "free", balance: 50 },
    ]);
    expect(await runMonthlyGrant(store, NOW, 2)).toEqual({ granted: 3, credits: 25 + 300, skipped: 0 });
    expect(users.map((u) => u.balance)).toEqual([30, 300, 50]);
    expect(await runMonthlyGrant(store, NOW, 2)).toEqual({ granted: 0, credits: 0, skipped: 3 });
  });
});

describe("purge deleted users", () => {
  it("deletes files then rows for users past 30 days only, and is idempotent", async () => {
    const deletedAt: Record<string, Date> = {
      old: new Date("2026-09-15T00:00:00Z"),
      recent: new Date("2026-10-20T00:00:00Z"),
    };
    const order: string[] = [];
    const remaining = new Set(Object.keys(deletedAt));
    const store = {
      async dueUsers(cutoff: Date) {
        return [...remaining].filter((id) => (deletedAt[id] as Date) < cutoff);
      },
      async storageKeys(userId: string) {
        return [`uploads/${userId}/original`];
      },
      async deleteKeys(keys: string[]) {
        order.push(`keys:${keys.join(",")}`);
      },
      async deleteUser(userId: string) {
        order.push(`user:${userId}`);
        remaining.delete(userId);
      },
    };
    expect(await runPurgeDeletedUsers(store, NOW)).toEqual({ purged: 1, failed: [] });
    expect(order).toEqual(["keys:uploads/old/original", "user:old"]);
    expect(await runPurgeDeletedUsers(store, NOW)).toEqual({ purged: 0, failed: [] });
  });

  it("reports users that fail without stopping the batch", async () => {
    const store = {
      dueUsers: async () => ["x", "y"],
      storageKeys: async () => [],
      deleteKeys: async () => {},
      deleteUser: async (id: string) => {
        if (id === "x") throw new Error("FK");
      },
    };
    expect(await runPurgeDeletedUsers(store, NOW)).toEqual({ purged: 1, failed: ["x"] });
  });
});

describe("cleanup pending assets", () => {
  it("removes pending assets older than 24 h with their objects, idempotently", async () => {
    const rows = [
      {
        id: "old",
        storageKey: "uploads/w/old/original",
        variants: {},
        status: "pending",
        createdAt: new Date("2026-10-30T00:00:00Z"),
      },
      {
        id: "new",
        storageKey: "uploads/w/new/original",
        variants: {},
        status: "pending",
        createdAt: new Date("2026-10-31T12:00:00Z"),
      },
    ];
    const deletedKeys: string[] = [];
    const store = {
      async stale(cutoff: Date) {
        return rows.filter((r) => r.status === "pending" && r.createdAt < cutoff);
      },
      async deleteKeys(keys: string[]) {
        deletedKeys.push(...keys);
      },
      async deleteAssets(ids: string[]) {
        const before = rows.length;
        for (const id of ids)
          rows.splice(
            rows.findIndex((r) => r.id === id),
            1,
          );
        return before - rows.length;
      },
    };
    expect(await runCleanupPendingAssets(store, NOW)).toEqual({ deleted: 1 });
    expect(deletedKeys).toEqual(["uploads/w/old/original"]);
    expect(rows.map((r) => r.id)).toEqual(["new"]);
    expect(await runCleanupPendingAssets(store, NOW)).toEqual({ deleted: 0 });
  });
});
