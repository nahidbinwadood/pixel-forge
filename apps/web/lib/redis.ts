import "server-only";
import { QUEUES, type UploadJob } from "@pixelforge/shared";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { ApiError } from "./api";

const g = globalThis as unknown as { redis?: Redis; uploadsQueue?: Queue<UploadJob> };

export const redis =
  g.redis ?? new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });

export const uploadsQueue =
  g.uploadsQueue ??
  new Queue<UploadJob>(QUEUES.uploads, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: 1_000,
      removeOnFail: 5_000,
    },
  });

if (process.env.NODE_ENV !== "production") Object.assign(g, { redis, uploadsQueue });

/**
 * Fixed-window limiter. ponytail: fixed window allows up to 2x burst at window edges;
 * swap for a sliding-window Lua script if that matters.
 */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<void> {
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const n = await redis.incr(k);
  if (n === 1) await redis.expire(k, windowSec);
  if (n > max) {
    throw new ApiError(429, "RATE_LIMITED", "Too many requests", undefined, { "Retry-After": String(windowSec) });
  }
}
