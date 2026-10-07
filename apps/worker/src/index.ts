import { createProvider } from "@pixelforge/ai";
import { prisma } from "@pixelforge/db";
import { type AIQueueJob, QUEUES, type UploadJob } from "@pixelforge/shared";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { processAIJob } from "./ai/process-ai";
import { startMaintenance } from "./cron/schedule";
import { processUpload } from "./process-upload";

// BullMQ workers require maxRetriesPerRequest: null (blocking commands).
const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });

const uploads = new Worker<UploadJob>(QUEUES.uploads, (job) => processUpload(job.data), {
  connection,
  concurrency: 4,
});

uploads.on("failed", (job, err) => console.error(`[uploads] job ${job?.id} failed:`, err.message));
uploads.on("error", (err) => console.error("[uploads] worker error:", err));
console.warn(`[worker] listening on queue "${QUEUES.uploads}"`);

// A misconfigured provider (e.g. gemini without a key) fails loudly here; the web tier refuses jobs then too.
const provider = createProvider();
const ai = new Worker<AIQueueJob>(
  QUEUES.ai,
  (job) => processAIJob(job.data.jobId, provider, { made: job.attemptsMade, max: job.opts.attempts ?? 1 }),
  { connection, concurrency: 3 },
);
ai.on("failed", (job, err) => console.error(`[ai] job ${job?.id} attempt failed:`, err.message));
ai.on("error", (err) => console.error("[ai] worker error:", err));
console.warn(`[worker] listening on queue "${QUEUES.ai}" (provider: ${provider.name})`);

const maintenance = await startMaintenance(connection);
console.warn(`[worker] maintenance crons scheduled on "${QUEUES.maintenance}"`);

async function shutdown(signal: string) {
  console.warn(`[worker] ${signal}: draining`);
  await Promise.all([uploads.close(), ai.close(), maintenance.worker.close()]); // waits for in-flight jobs
  await maintenance.queue.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
