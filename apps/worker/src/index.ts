import { prisma } from "@pixelforge/db";
import { QUEUES, type UploadJob } from "@pixelforge/shared";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
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

async function shutdown(signal: string) {
  console.warn(`[worker] ${signal}: draining`);
  await uploads.close(); // waits for in-flight jobs
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
