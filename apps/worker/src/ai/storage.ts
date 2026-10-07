import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "auto",
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});
export const Bucket = process.env.S3_BUCKET_UPLOADS ?? "pixelforge-uploads";

export async function getObject(Key: string): Promise<Uint8Array> {
  const obj = await s3.send(new GetObjectCommand({ Bucket, Key }));
  if (!obj.Body) throw new Error(`empty body for ${Key}`);
  return obj.Body.transformToByteArray();
}

export function putObject(Key: string, Body: Uint8Array, ContentType: string) {
  return s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
}

/** Best-effort bulk delete (1000 keys per request). */
export async function deleteKeys(keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 1000) {
    const Objects = keys.slice(i, i + 1000).map((Key) => ({ Key }));
    if (Objects.length) await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects, Quiet: true } }));
  }
}

/** Every storage key an asset row owns: the original plus its variants. */
export function assetKeys(a: { storageKey: string; variants: unknown }): string[] {
  const v = (a.variants ?? {}) as Record<string, unknown>;
  return [a.storageKey, ...Object.values(v).filter((k): k is string => typeof k === "string")];
}
