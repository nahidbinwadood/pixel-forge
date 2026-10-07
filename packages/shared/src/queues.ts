/** BullMQ queue contract shared by apps/web (producer) and apps/worker (consumer). */
export const QUEUES = { uploads: "uploads" } as const;

/** Enqueued by POST /uploads/:id/complete once the object exists in storage. */
export interface UploadJob {
  assetId: string;
}

/** Storage key layout in S3_BUCKET_UPLOADS. Variants sit next to the original. */
export const storageKeys = {
  original: (workspaceId: string, assetId: string) => `uploads/${workspaceId}/${assetId}/original`,
  variant: (originalKey: string, name: "thumb" | "preview") => originalKey.replace(/original$/, `${name}.webp`),
};
