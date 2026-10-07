import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { prisma } from "@pixelforge/db";
import { requireUser, route } from "@/lib/api";
import { redis, uploadsQueue } from "@/lib/redis";
import { s3 } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function timed(fn: () => Promise<unknown>): Promise<{ ok: boolean; ms: number; error?: string }> {
  const start = performance.now();
  try {
    await fn();
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - start), error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Shallow liveness (no auth): used by Playwright's webServer readiness check and uptime monitors —
 * it must stay fast and dependency-free. The deep per-dependency check (SECURITY.md hardening pass)
 * requires admin: it leaks infra details (queue depth, bucket name) that anonymous callers shouldn't see.
 */
export const GET = route(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("deep") !== "1") {
    return Response.json({ status: "ok", time: new Date().toISOString() });
  }

  await requireUser({ admin: true });
  const [db, redisCheck, storage, queue] = await Promise.all([
    timed(() => prisma.$queryRaw`SELECT 1`),
    timed(() => redis.ping()),
    timed(() => s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_UPLOADS ?? "pixelforge-uploads" }))),
    timed(() => uploadsQueue.getJobCounts("waiting", "active", "delayed", "failed", "completed")),
  ]);
  const checks = { database: db, redis: redisCheck, storage, uploadsQueue: queue };
  const ok = Object.values(checks).every((c) => c.ok);
  return Response.json(
    { status: ok ? "ok" : "degraded", time: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 },
  );
});
