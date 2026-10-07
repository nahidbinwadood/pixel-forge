import { timingSafeEqual } from "node:crypto";
import { refundStaleJobs } from "@/lib/ai/jobs";
import { ApiError, notFound, route } from "@/lib/api";
import { runCleanupPendingAssets } from "@/lib/jobs/cron/cleanup-pending";
import { runMonthlyGrant } from "@/lib/jobs/cron/monthly-grant";
import { runPurgeDeletedUsers } from "@/lib/jobs/cron/purge-users";
import { retryStaleUploads } from "@/lib/jobs/run";
import { pruneRateLimits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Schedules live in vercel.json. Every job is idempotent, so a missed or doubled tick is harmless. */
const JOBS: Record<string, () => Promise<unknown>> = {
  "monthly-credit-grant": () => runMonthlyGrant(),
  "purge-deleted-users": () => runPurgeDeletedUsers(),
  cleanup: async () => ({
    pendingAssets: await runCleanupPendingAssets(),
    staleUploads: await retryStaleUploads(),
    staleAIJobs: await refundStaleJobs(),
    rateLimitRows: await pruneRateLimits(),
  }),
};

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without the env var every call is refused. */
function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const GET = route<{ job: string }>(async (req, { job }) => {
  if (!authorized(req.headers.get("authorization"))) throw new ApiError(401, "UNAUTHORIZED", "Not authorized");
  const run = JOBS[job];
  if (!run) throw notFound("Cron job");
  const result = await run();
  console.warn(`[cron] ${job}:`, JSON.stringify(result));
  return Response.json({ job, result });
});
