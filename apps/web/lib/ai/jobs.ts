import "server-only";
import { type AIJob, Prisma, prisma } from "@pixelforge/db";
import { type AIJobOutput, type CreateAIJobInput, jobCost } from "@pixelforge/shared";
import { personalWorkspaceId } from "../account";
import { ApiError, notFound } from "../api";
import { isEnabled } from "../flags";
import { rateLimit } from "../redis";
import { presignGet } from "../storage";
import { aiProvider, aiQueue, aiStatus } from "./provider";

type SessionUser = { id: string; role?: string | null };

export const insufficientCredits = (balance: number, cost: number) =>
  new ApiError(402, "INSUFFICIENT_CREDITS", "Not enough credits for this job", { balance, cost });

/** Text that must pass moderation before any credit is charged. */
export function moderatedText(body: CreateAIJobInput): string | null {
  if (body.tool === "text_to_image") return [body.input.prompt, body.input.negativePrompt].filter(Boolean).join("\n");
  if (body.tool === "write") return body.input.topic;
  return null;
}

/** Idempotency keys are namespaced per user, so one user's key can never return another user's job. */
export const scopedKey = (userId: string, key: string) => `${userId}:${key}`;

/**
 * POST /ai/jobs (ARCHITECTURE §3): flag → rate limit → moderation → charge + insert in one locked TX → enqueue.
 * Returns the existing job for a repeated Idempotency-Key.
 */
export async function createJob(user: SessionUser, idempotencyKey: string, body: CreateAIJobInput) {
  const key = scopedKey(user.id, idempotencyKey);
  const existing = await prisma.aIJob.findUnique({ where: { idempotencyKey: key } });
  if (existing) return { job: existing, replayed: true };

  if (!(await isEnabled(`ai.${body.tool}`, { id: user.id, role: user.role ?? "user" }))) {
    throw new ApiError(403, "FEATURE_DISABLED", "This AI tool is turned off right now");
  }
  const status = aiStatus();
  if (!status.ready) throw new ApiError(503, "AI_UNAVAILABLE", "AI is not configured on this server");
  await rateLimit(`ai:${user.id}`, 10, 60);

  const text = moderatedText(body);
  if (text) {
    const verdict = await aiProvider().moderateText(text, AbortSignal.timeout(20_000));
    if (!verdict.allowed) throw new ApiError(422, "CONTENT_BLOCKED", "This prompt isn't allowed", verdict.reason);
  }

  if (body.tool === "bg_remove") {
    const workspaceId = await personalWorkspaceId(user.id);
    const asset = await prisma.asset.findFirst({
      where: { id: body.input.assetId, workspaceId, status: "ready", kind: { in: ["upload", "ai_output"] } },
      select: { id: true },
    });
    if (!asset) throw notFound("Image");
  }

  const cost = jobCost(body.tool, body.tool === "text_to_image" ? body.input.variations : 1);
  let job: AIJob;
  try {
    job = await prisma.$transaction(async (tx) => {
      // Row lock on the user serializes concurrent charges, so two parallel jobs can't overdraw.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
      const sum = await tx.creditLedger.aggregate({ where: { userId: user.id }, _sum: { delta: true } });
      const balance = sum._sum.delta ?? 0;
      if (balance < cost) throw insufficientCredits(balance, cost);
      const created = await tx.aIJob.create({
        data: {
          userId: user.id,
          tool: body.tool,
          input: body.input,
          provider: status.provider,
          costCredits: cost,
          idempotencyKey: key,
        },
      });
      await tx.creditLedger.create({
        data: {
          userId: user.id,
          delta: -cost,
          reason: "job_charge",
          jobId: created.id,
          dedupeKey: `charge:${created.id}`,
        },
      });
      return created;
    });
  } catch (e) {
    // Same key raced in from a parallel request: return the winner.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const winner = await prisma.aIJob.findUnique({ where: { idempotencyKey: key } });
      if (winner) return { job: winner, replayed: true };
    }
    throw e;
  }

  try {
    await aiQueue.add("run", { jobId: job.id }, { jobId: job.id });
  } catch (e) {
    await failAndRefund(job, "Could not queue the job");
    throw new ApiError(503, "QUEUE_UNAVAILABLE", "Couldn't start the job. Your credits were refunded.", String(e));
  }
  return { job, replayed: false };
}

/** Marks a job failed and refunds it; the dedupe key makes a second call a no-op. */
export async function failAndRefund(job: Pick<AIJob, "id" | "userId" | "costCredits">, error: string) {
  await prisma.$transaction([
    prisma.aIJob.updateMany({
      where: { id: job.id, status: { in: ["queued", "running"] } },
      data: { status: "failed", error, finishedAt: new Date() },
    }),
    prisma.creditLedger.upsert({
      where: { dedupeKey: `refund:${job.id}` },
      update: {},
      create: {
        userId: job.userId,
        delta: job.costCredits,
        reason: "job_refund",
        jobId: job.id,
        dedupeKey: `refund:${job.id}`,
      },
    }),
  ]);
}

export interface JobAsset {
  id: string;
  url: string;
  previewUrl: string | null;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
  mimeType: string;
}

type Variants = { thumb?: string; preview?: string };

async function signAssets(ids: string[], userId: string): Promise<JobAsset[]> {
  if (ids.length === 0) return [];
  const workspaceId = await personalWorkspaceId(userId);
  const rows = await prisma.asset.findMany({ where: { id: { in: ids }, workspaceId, status: "ready" } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = ids.flatMap((id) => {
    const r = byId.get(id);
    return r ? [r] : [];
  });
  return Promise.all(
    ordered.map(async (a) => {
      const v = a.variants as Variants;
      return {
        id: a.id,
        url: await presignGet(a.storageKey),
        previewUrl: v.preview ? await presignGet(v.preview) : null,
        thumbUrl: v.thumb ? await presignGet(v.thumb) : null,
        width: a.width,
        height: a.height,
        mimeType: a.mimeType,
      };
    }),
  );
}

/** API shape of a job. Asset URLs are presigned per request; nothing outside the user's workspace is resolved. */
export async function serializeJob(job: AIJob, opts: { favorite?: boolean } = {}) {
  const output = job.output as AIJobOutput | null;
  const input = job.input as Record<string, unknown>;
  const sourceId = job.tool === "bg_remove" && typeof input.assetId === "string" ? input.assetId : null;
  const [assets, source] = await Promise.all([
    output && "assetIds" in output ? signAssets(output.assetIds, job.userId) : Promise.resolve([]),
    sourceId ? signAssets([sourceId], job.userId).then((a) => a[0] ?? null) : Promise.resolve(null),
  ]);
  return {
    id: job.id,
    tool: job.tool,
    status: job.status,
    input,
    costCredits: job.costCredits,
    provider: job.provider,
    error: job.error,
    texts: output && "texts" in output ? output.texts : [],
    assets,
    source,
    favorite: opts.favorite ?? false,
    createdAt: job.createdAt.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
  };
}
export type SerializedJob = Awaited<ReturnType<typeof serializeJob>>;

export async function getOwnJob(userId: string, id: string) {
  const job = await prisma.aIJob.findFirst({ where: { id, userId } });
  if (!job) throw notFound("Job");
  return job;
}
