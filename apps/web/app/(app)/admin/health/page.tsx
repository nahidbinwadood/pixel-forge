import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { prisma } from "@pixelforge/db";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redis, uploadsQueue } from "@/lib/redis";
import { s3 } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface Check {
  name: string;
  ok: boolean;
  ms: number;
  detail?: string;
}

async function check(name: string, fn: () => Promise<string | undefined>, timeoutMs = 3_000): Promise<Check> {
  const start = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const detail = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
      }),
    ]);
    return { name, ok: true, ms: Math.round(performance.now() - start), detail };
  } catch (e) {
    return {
      name,
      ok: false,
      ms: Math.round(performance.now() - start),
      detail: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function AdminHealthPage() {
  const t = await getTranslations("admin");
  const checks = await Promise.all([
    check("Postgres", async () => {
      await prisma.$queryRaw`SELECT 1`;
      return undefined;
    }),
    check("Redis", async () => redis.ping()),
    check("Storage (S3)", async () => {
      await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_UPLOADS ?? "pixelforge-uploads" }));
      return undefined;
    }),
    check("Uploads queue", async () => {
      const c = await uploadsQueue.getJobCounts("waiting", "active", "delayed", "failed", "completed");
      return Object.entries(c)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
    }),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {checks.map((c) => (
        <Card key={c.name}>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{c.name}</CardTitle>
            <Badge variant={c.ok ? "secondary" : "destructive"}>{c.ok ? t("ok") : t("down")}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="tabular-nums">{c.ms} ms</span>
            {c.detail && <span className="break-words">{c.detail}</span>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
