import "server-only";
import { prisma } from "@pixelforge/db";
import { after } from "next/server";
import { aiProvider } from "../ai/provider";
import { processAIJob } from "./ai/process-ai";
import { processUpload } from "./upload";

/**
 * Background work on Vercel (ASSUMPTIONS D-V1): jobs run in the same function invocation after the response is
 * sent (`after()`), bounded by the route's `maxDuration`. Retries are in-process with exponential backoff.
 * ponytail: if the instance dies mid-job, nothing re-queues it; `recoverStale` (lazy on read + daily cron) is the
 * safety net. Move to a real queue (Vercel Queues / Inngest) when jobs outgrow one invocation.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AI_ATTEMPTS = 3;
const UPLOAD_ATTEMPTS = 3;

/** A job older than this cannot still be running: maxDuration is 300 s. */
export const STALE_MS = 10 * 60 * 1000;

async function withRetries(label: string, attempts: number, baseMs: number, fn: (made: number) => Promise<void>) {
  for (let made = 0; made < attempts; made++) {
    try {
      return await fn(made);
    } catch (e) {
      console.warn(`[jobs] ${label} attempt ${made + 1}/${attempts} failed:`, e instanceof Error ? e.message : e);
      if (made + 1 < attempts) await sleep(baseMs * 2 ** made);
    }
  }
}

export function runAIJobAfterResponse(jobId: string) {
  after(() =>
    withRetries(`ai ${jobId}`, AI_ATTEMPTS, 3_000, (made) =>
      processAIJob(jobId, aiProvider(), { made, max: AI_ATTEMPTS }),
    ),
  );
}

export function processUploadAfterResponse(assetId: string) {
  after(() => withRetries(`upload ${assetId}`, UPLOAD_ATTEMPTS, 2_000, () => processUpload({ assetId })));
}

/** Uploads stuck in `processing` past the deadline get one more try (processUpload is idempotent). */
export async function retryStaleUploads(now = Date.now()) {
  const stale = await prisma.asset.findMany({
    where: { status: "processing", createdAt: { lt: new Date(now - STALE_MS) } },
    select: { id: true },
    take: 50,
  });
  let retried = 0;
  for (const { id } of stale) {
    await processUpload({ assetId: id }).then(
      () => retried++,
      (e) => console.warn(`[jobs] stale upload ${id} still failing:`, e instanceof Error ? e.message : e),
    );
  }
  return { stale: stale.length, retried };
}
