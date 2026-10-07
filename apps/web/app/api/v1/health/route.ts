import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { prisma } from "@pixelforge/db";
import { requireUser, route } from "@/lib/api";
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
 * requires admin: it leaks infra details (bucket name, latencies) that anonymous callers shouldn't see.
 */
export const GET = route(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("deep") !== "1") {
    return Response.json({ status: "ok", time: new Date().toISOString() });
  }

  await requireUser({ admin: true });
  const [db, storage] = await Promise.all([
    timed(() => prisma.$queryRaw`SELECT 1`),
    timed(() => s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_UPLOADS ?? "pixelforge-uploads" }))),
  ]);
  const checks = { database: db, storage };
  const ok = Object.values(checks).every((c) => c.ok);
  return Response.json(
    { status: ok ? "ok" : "degraded", time: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 },
  );
});
