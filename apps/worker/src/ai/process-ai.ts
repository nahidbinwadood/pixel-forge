import { createHash, randomUUID } from "node:crypto";
import {
  type AIProvider,
  ContentBlockedError,
  type ImageData,
  ProviderError,
  REMOVE_BG_INSTRUCTION,
} from "@pixelforge/ai";
import { type AIJob, prisma } from "@pixelforge/db";
import {
  type AIJobOutput,
  type AITool,
  bgRemoveInput,
  storageKeys,
  textToImageInput,
  writeInput,
} from "@pixelforge/shared";
import sharp from "sharp";
import { keyOutBorderWhite } from "./alpha";
import { classifyFailure, publicError } from "./outcome";
import { assetKeys, deleteKeys, getObject, putObject } from "./storage";

/** Per provider call; BullMQ retries on top of this (ARCHITECTURE §3). */
const CALL_TIMEOUT_MS = 90_000;
/** Longest edge sent to the image model for editing. */
const EDIT_INPUT_PX = 1536;

interface RunContext {
  job: AIJob;
  workspaceId: string;
  provider: AIProvider;
  /** Assets created during this attempt, removed again if the attempt fails. */
  created: { id: string; storageKey: string; variants: unknown }[];
}

async function blockUnlessSafe(provider: AIProvider, image: ImageData) {
  const verdict = await provider.moderateImage(image, AbortSignal.timeout(CALL_TIMEOUT_MS));
  if (!verdict.allowed) throw new ContentBlockedError(`Output failed moderation: ${verdict.reason}`);
}

/** Re-encode (strips metadata), make variants, write to storage and create a ready `ai_output` asset. */
async function storeImage(ctx: RunContext, png: Buffer, extraLicense: Record<string, unknown>): Promise<string> {
  const id = randomUUID().replace(/-/g, "");
  const key = storageKeys.aiOutput(ctx.workspaceId, id);
  const thumbKey = storageKeys.variant(key, "thumb");
  const previewKey = storageKeys.variant(key, "preview");
  const meta = await sharp(png).metadata();
  const variant = (px: number) =>
    sharp(png).resize(px, px, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const [thumb, preview] = await Promise.all([variant(400), variant(1600)]);
  await Promise.all([
    putObject(key, png, "image/png"),
    putObject(thumbKey, thumb, "image/webp"),
    putObject(previewKey, preview, "image/webp"),
  ]);
  const variants = { thumb: thumbKey, preview: previewKey };
  ctx.created.push({ id, storageKey: key, variants });
  await prisma.asset.create({
    data: {
      id,
      workspaceId: ctx.workspaceId,
      ownerId: ctx.job.userId,
      kind: "ai_output",
      status: "ready",
      storageKey: key,
      mimeType: "image/png",
      bytes: png.length,
      width: meta.width,
      height: meta.height,
      variants,
      tags: ["ai", ctx.job.tool],
      sha256: createHash("sha256").update(png).digest("hex"),
      license: { source: "ai", provider: ctx.provider.name, jobId: ctx.job.id, tool: ctx.job.tool, ...extraLicense },
    },
  });
  return id;
}

async function runTextToImage(ctx: RunContext): Promise<AIJobOutput> {
  const input = textToImageInput.parse(ctx.job.input);
  const assetIds: string[] = [];
  for (let variant = 0; variant < input.variations; variant++) {
    const img = await ctx.provider.generateImage({
      prompt: input.prompt,
      style: input.style,
      aspectRatio: input.aspectRatio,
      negativePrompt: input.negativePrompt,
      variant,
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    await blockUnlessSafe(ctx.provider, img);
    const png = await sharp(img.data).png().toBuffer();
    assetIds.push(await storeImage(ctx, png, { filename: `ai-${ctx.job.id.slice(-6)}-${variant + 1}.png` }));
  }
  return { assetIds };
}

async function runBgRemove(ctx: RunContext): Promise<AIJobOutput> {
  const { assetId } = bgRemoveInput.parse(ctx.job.input);
  const source = await prisma.asset.findFirst({
    where: { id: assetId, workspaceId: ctx.workspaceId, status: "ready" },
    select: { storageKey: true, license: true },
  });
  if (!source) throw new ProviderError("Source image no longer exists", false);
  const original = await getObject(source.storageKey);
  const input = await sharp(original)
    .rotate()
    .resize(EDIT_INPUT_PX, EDIT_INPUT_PX, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();

  const edited = await ctx.provider.editImage({
    image: { data: input, mimeType: "image/png" },
    instruction: REMOVE_BG_INSTRUCTION,
    signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
  });
  await blockUnlessSafe(ctx.provider, edited);

  const { data, info } = await sharp(edited.data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = new Uint8Array(data.buffer, data.byteOffset, data.length);
  keyOutBorderWhite(rgba, info.width, info.height);
  const png = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
  const name = (source.license as { filename?: string } | null)?.filename?.replace(/\.[a-z0-9]+$/i, "") ?? "image";
  return { assetIds: [await storeImage(ctx, png, { filename: `${name}-no-bg.png`, sourceAssetId: assetId })] };
}

async function runWrite(ctx: RunContext): Promise<AIJobOutput> {
  const input = writeInput.parse(ctx.job.input);
  const texts = await ctx.provider.writeText({ ...input, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
  if (texts.length === 0) throw new Error("Provider returned no text");
  const verdict = await ctx.provider.moderateText(texts.join("\n"), AbortSignal.timeout(CALL_TIMEOUT_MS));
  if (!verdict.allowed) throw new ContentBlockedError(`Output failed moderation: ${verdict.reason}`);
  return { texts };
}

const RUNNERS: Record<AITool, (ctx: RunContext) => Promise<AIJobOutput>> = {
  text_to_image: runTextToImage,
  bg_remove: runBgRemove,
  write: runWrite,
};

/** Ends a job as failed/blocked and refunds its charge. The refund dedupe key makes this idempotent. */
async function finalizeWithRefund(job: AIJob, status: "failed" | "blocked", error: string) {
  await prisma.$transaction([
    prisma.aIJob.updateMany({
      where: { id: job.id, status: { in: ["queued", "running"] } },
      data: { status, error, finishedAt: new Date() },
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

/**
 * Runs one AI job (ARCHITECTURE §3). Idempotent: a job that already finished is skipped, and assets from a
 * failed attempt are removed before the retry. Throws only when BullMQ should retry.
 */
export async function processAIJob(
  jobId: string,
  provider: AIProvider,
  attempt: { made: number; max: number },
): Promise<void> {
  const job = await prisma.aIJob.findUnique({ where: { id: jobId } });
  if (!job || (job.status !== "queued" && job.status !== "running")) return;

  const membership = await prisma.membership.findFirst({
    where: { userId: job.userId, workspace: { personal: true } },
    select: { workspaceId: true },
  });
  if (!membership) {
    await finalizeWithRefund(job, "failed", "Account has no workspace");
    return;
  }

  await prisma.aIJob.update({
    where: { id: job.id },
    data: { status: "running", startedAt: job.startedAt ?? new Date(), provider: provider.name },
  });

  const ctx: RunContext = { job, workspaceId: membership.workspaceId, provider, created: [] };
  const started = Date.now();
  try {
    const output = await RUNNERS[job.tool as AITool](ctx);
    await prisma.aIJob.update({
      where: { id: job.id },
      data: { status: "succeeded", output, error: null, finishedAt: new Date() },
    });
    console.warn(`[ai] job ${job.id} ${job.tool} succeeded via ${provider.name} in ${Date.now() - started} ms`);
  } catch (err) {
    await cleanup(ctx);
    const outcome = classifyFailure(err, attempt.made, attempt.max);
    console.warn(`[ai] job ${job.id} ${job.tool} ${outcome.kind} via ${provider.name}: ${outcome.message}`);
    if (outcome.kind === "retry") throw err;
    await finalizeWithRefund(job, outcome.kind, publicError(outcome));
  }
}

async function cleanup(ctx: RunContext) {
  if (ctx.created.length === 0) return;
  await prisma.asset.deleteMany({ where: { id: { in: ctx.created.map((a) => a.id) } } }).catch(() => {});
  await deleteKeys(ctx.created.flatMap(assetKeys)).catch(() => {});
}
