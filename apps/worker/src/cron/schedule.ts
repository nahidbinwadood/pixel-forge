import { type MaintenanceJobName, QUEUES } from "@pixelforge/shared";
import { type ConnectionOptions, Queue, Worker } from "bullmq";
import { runCleanupPendingAssets } from "./cleanup-pending";
import { runMonthlyGrant } from "./monthly-grant";
import { runPurgeDeletedUsers } from "./purge-users";

/** Cron patterns (UTC). Each job is idempotent, so a missed or doubled tick is harmless. */
export const SCHEDULES: Record<MaintenanceJobName, string> = {
  "monthly-credit-grant": "5 0 1 * *", // 00:05 on the 1st
  "purge-deleted-users": "30 3 * * *", // daily 03:30
  "cleanup-pending-assets": "15 * * * *", // hourly
};

const RUNNERS: Record<MaintenanceJobName, () => Promise<unknown>> = {
  "monthly-credit-grant": () => runMonthlyGrant(),
  "purge-deleted-users": () => runPurgeDeletedUsers(),
  "cleanup-pending-assets": () => runCleanupPendingAssets(),
};

/** Registers repeatable jobs (upsert = safe on every boot) and starts their worker. */
export async function startMaintenance(connection: ConnectionOptions) {
  const queue = new Queue(QUEUES.maintenance, { connection });
  for (const [name, pattern] of Object.entries(SCHEDULES)) {
    await queue.upsertJobScheduler(
      name,
      { pattern, tz: "UTC" },
      { name, opts: { removeOnComplete: 50, removeOnFail: 200 } },
    );
  }
  const worker = new Worker(
    QUEUES.maintenance,
    async (job) => {
      const run = RUNNERS[job.name as MaintenanceJobName];
      if (!run) throw new Error(`unknown maintenance job ${job.name}`);
      const result = await run();
      console.warn(`[cron] ${job.name}:`, JSON.stringify(result));
      return result;
    },
    { connection, concurrency: 1 },
  );
  worker.on("failed", (job, err) => console.error(`[cron] ${job?.name} failed:`, err.message));
  return { queue, worker };
}
