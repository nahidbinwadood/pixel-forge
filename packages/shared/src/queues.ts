/** BullMQ queue contract shared by apps/web (producer) and apps/worker (consumer). */
export const QUEUES = { uploads: "uploads", ai: "ai", maintenance: "maintenance" } as const;

/** Enqueued by POST /uploads/:id/complete once the object exists in storage. */
export interface UploadJob {
  assetId: string;
}

/** Enqueued by POST /ai/jobs after the credit charge commits. The worker reads everything else from the AIJob row. */
export interface AIQueueJob {
  jobId: string;
}

/** Repeatable maintenance crons (worker). */
export type MaintenanceJobName = "monthly-credit-grant" | "purge-deleted-users" | "cleanup-pending-assets";

/** Storage key layout in S3_BUCKET_UPLOADS. Variants sit next to the original. */
export const storageKeys = {
  original: (workspaceId: string, assetId: string) => `uploads/${workspaceId}/${assetId}/original`,
  variant: (originalKey: string, name: "thumb" | "preview") => originalKey.replace(/original$/, `${name}.webp`),
  aiOutput: (workspaceId: string, assetId: string) => `ai/${workspaceId}/${assetId}/original`,
};
