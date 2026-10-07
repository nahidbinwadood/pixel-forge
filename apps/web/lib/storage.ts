import "server-only";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "auto",
  forcePathStyle: true,
  // SDK v3 defaults to checksums baked into presigned URLs; browsers can't match them (BadDigest on R2/SeaweedFS).
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

const Bucket = process.env.S3_BUCKET_UPLOADS ?? "pixelforge-uploads";

/** Signed PUT: content type and length are part of the signature, so the client can't swap them. */
export function presignPut(key: string, contentType: string, contentLength: number) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket, Key: key, ContentType: contentType, ContentLength: contentLength }),
    { expiresIn: 15 * 60, signableHeaders: new Set(["content-type", "content-length"]) },
  );
}

export function presignGet(key: string, expiresIn = 60 * 60) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn });
}

export async function objectSize(key: string): Promise<number | null> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    return head.ContentLength ?? null;
  } catch {
    return null;
  }
}

export async function deleteObjects(keys: string[]) {
  if (keys.length === 0) return;
  await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: keys.map((Key) => ({ Key })) } }));
}
