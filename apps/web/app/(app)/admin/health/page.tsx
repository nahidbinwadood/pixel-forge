import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { prisma } from "@pixelforge/db";
import { DatabaseIcon, HardDriveIcon, LayersIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { s3 } from "@/lib/storage";
import { HealthCard } from "../_components/health-card";

export const dynamic = "force-dynamic";

interface Check {
  name: string;
  icon: ReactNode;
  ok: boolean;
  ms: number;
  detail?: string;
}

async function check(
  name: string,
  icon: ReactNode,
  fn: () => Promise<string | undefined>,
  timeoutMs = 3_000,
): Promise<Check> {
  const start = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const detail = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
      }),
    ]);
    return { name, icon, ok: true, ms: Math.round(performance.now() - start), detail };
  } catch (e) {
    return {
      name,
      icon,
      ok: false,
      ms: Math.round(performance.now() - start),
      detail: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function AdminHealthPage() {
  const [t, ...checks] = await Promise.all([
    getTranslations("admin"),
    check("Postgres", <DatabaseIcon />, async () => {
      await prisma.$queryRaw`SELECT 1`;
      return undefined;
    }),
    check("Storage (S3)", <HardDriveIcon />, async () => {
      await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_UPLOADS ?? "pixelforge-uploads" }));
      return undefined;
    }),
    check("Background jobs", <LayersIcon />, async () => {
      const [uploads, ai] = await Promise.all([
        prisma.asset.count({ where: { status: "processing" } }),
        prisma.aIJob.count({ where: { status: { in: ["queued", "running"] } } }),
      ]);
      return `uploads processing: ${uploads} · AI jobs running: ${ai}`;
    }),
  ]);
  const up = checks.filter((c) => c.ok).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t("servicesUp", { up, total: checks.length })}</p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {checks.map((c, i) => (
          <li key={c.name}>
            <HealthCard
              index={i}
              name={c.name}
              icon={c.icon}
              ok={c.ok}
              ms={c.ms}
              detail={c.detail}
              okLabel={t("ok")}
              downLabel={t("down")}
              latencyLabel={t("latency")}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
