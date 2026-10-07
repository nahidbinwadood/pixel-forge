import "server-only";
import { prisma } from "@pixelforge/db";
import { ApiError } from "./api";

/** Our keys in the shared `RateLimit` table (Better Auth uses it too) start with this; the daily cron prunes them. */
export const RATE_LIMIT_PREFIX = "rl:";

/**
 * Fixed-window limiter on Postgres: one atomic upsert per call, no Redis to run on Vercel.
 * ponytail: fixed window allows up to 2x burst at window edges, and every call is a DB write;
 * move to Upstash Redis if this shows up in DB load.
 */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<void> {
  const k = `${RATE_LIMIT_PREFIX}${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" (id, key, count, "lastRequest")
    VALUES (gen_random_uuid()::text, ${k}, 1, ${BigInt(Date.now())})
    ON CONFLICT (key) DO UPDATE SET count = "RateLimit".count + 1, "lastRequest" = EXCLUDED."lastRequest"
    RETURNING count`;
  if ((rows[0]?.count ?? 0) > max) {
    throw new ApiError(429, "RATE_LIMITED", "Too many requests", undefined, { "Retry-After": String(windowSec) });
  }
}

/** Deletes our expired windows (the longest window is 1 h, so a day is plenty). */
export async function pruneRateLimits(now = Date.now()): Promise<number> {
  const cutoff = BigInt(now - 24 * 60 * 60 * 1000);
  return prisma.$executeRaw`DELETE FROM "RateLimit" WHERE key LIKE ${`${RATE_LIMIT_PREFIX}%`} AND "lastRequest" < ${cutoff}`;
}
