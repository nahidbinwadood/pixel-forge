import "server-only";
import { type AIProvider, createProvider, providerConfigured, providerName } from "@pixelforge/ai";
import { type AIQueueJob, QUEUES } from "@pixelforge/shared";
import { Queue } from "bullmq";
import { redis } from "../redis";

const g = globalThis as unknown as { aiProvider?: AIProvider; aiQueue?: Queue<AIQueueJob> };

/** Provider used by the web tier only for prompt moderation; generation runs in the worker. */
export function aiProvider(): AIProvider {
  g.aiProvider ??= createProvider();
  return g.aiProvider;
}

/** Status for the UI: say plainly when AI is in demo mode or not configured. */
export function aiStatus(): { provider: "mock" | "gemini" | "invalid"; ready: boolean } {
  let provider: "mock" | "gemini" | "invalid";
  try {
    provider = providerName();
  } catch {
    provider = "invalid";
  }
  return { provider, ready: providerConfigured() };
}

export const aiQueue =
  g.aiQueue ??
  new Queue<AIQueueJob>(QUEUES.ai, {
    connection: redis,
    defaultJobOptions: {
      // ARCHITECTURE §3: timeout + 3 retries with exponential backoff (attempts = 1 + 3).
      attempts: 4,
      backoff: { type: "exponential", delay: 3_000 },
      removeOnComplete: 1_000,
      removeOnFail: 5_000,
    },
  });

if (process.env.NODE_ENV !== "production") g.aiQueue = aiQueue;
