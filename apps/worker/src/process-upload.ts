import { createHash } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@pixelforge/db";
import { PLANS, storageKeys, type UploadJob } from "@pixelforge/shared";
import heicConvert from "heic-convert";
import sharp from "sharp";
import { normalizeDeclared, sniffImageType } from "./sniff";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "auto",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});
const Bucket = process.env.S3_BUCKET_UPLOADS ?? "pixelforge-uploads";
const MAX_BYTES = Math.max(...Object.values(PLANS).map((p) => p.maxUploadMb)) * 1024 * 1024;

/** Bad file content → asset rejected. Anything else (S3/DB/network) throws so BullMQ retries. */
class InvalidContent extends Error {}

async function encode<T>(what: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new InvalidContent(`${what}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function processUpload({ assetId }: UploadJob): Promise<void> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (asset?.status !== "processing") return; // already handled or deleted: idempotent no-op

  const key = asset.storageKey;
  const thumbKey = storageKeys.variant(key, "thumb");
  const previewKey = storageKeys.variant(key, "preview");

  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
    if (!obj.Body) throw new Error(`empty body for ${key}`);
    const input = await obj.Body.transformToByteArray();
    if (input.length === 0 || input.length > MAX_BYTES) throw new InvalidContent(`size ${input.length} out of range`);

    const sniffed = sniffImageType(input);
    if (!sniffed) throw new InvalidContent("unrecognized file signature");
    if (sniffed !== normalizeDeclared(asset.mimeType)) {
      throw new InvalidContent(`declared ${asset.mimeType} but content is ${sniffed}`);
    }

    // Re-encode: strips EXIF/GPS (sharp drops metadata by default) and neutralizes polyglot payloads.
    // sharp's default limitInputPixels stays on as a decompression-bomb guard.
    let mimeType: string = sniffed;
    let stored: Buffer;
    if (sniffed === "image/heic") {
      const jpeg = await encode("heic decode", () => heicConvert({ buffer: input, format: "JPEG", quality: 0.92 }));
      stored = await encode("heic re-encode", () => sharp(jpeg).rotate().jpeg({ quality: 90 }).toBuffer());
      mimeType = "image/jpeg";
    } else if (sniffed === "image/gif") {
      stored = await encode("gif re-encode", () => sharp(input, { animated: true }).gif().toBuffer());
    } else if (sniffed === "image/webp") {
      stored = await encode("webp re-encode", () => sharp(input, { animated: true }).webp({ quality: 90 }).toBuffer());
    } else if (sniffed === "image/png") {
      stored = await encode("png re-encode", () => sharp(input).rotate().png().toBuffer());
    } else {
      stored = await encode("jpeg re-encode", () => sharp(input).rotate().jpeg({ quality: 90 }).toBuffer());
    }

    const meta = await encode("metadata", () => sharp(stored).metadata());
    const variant = (px: number) =>
      encode("variant", () =>
        sharp(stored).resize(px, px, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
      );
    const [thumb, preview] = await Promise.all([variant(400), variant(1600)]);

    await Promise.all([
      s3.send(new PutObjectCommand({ Bucket, Key: key, Body: stored, ContentType: mimeType })),
      s3.send(new PutObjectCommand({ Bucket, Key: thumbKey, Body: thumb, ContentType: "image/webp" })),
      s3.send(new PutObjectCommand({ Bucket, Key: previewKey, Body: preview, ContentType: "image/webp" })),
    ]);

    await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: "ready",
        mimeType,
        bytes: stored.length,
        width: meta.width,
        height: meta.pageHeight ?? meta.height,
        sha256: createHash("sha256").update(stored).digest("hex"),
        variants: { thumb: thumbKey, preview: previewKey },
      },
    });
  } catch (e) {
    if (!(e instanceof InvalidContent)) throw e;
    console.warn(`[uploads] rejected asset ${assetId}: ${e.message}`);
    await prisma.asset.update({ where: { id: assetId }, data: { status: "rejected" } });
    await Promise.all(
      [key, thumbKey, previewKey].map((Key) => s3.send(new DeleteObjectCommand({ Bucket, Key })).catch(() => {})),
    );
  }
}
