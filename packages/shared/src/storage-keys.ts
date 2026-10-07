/** Storage key layout in S3_BUCKET_UPLOADS. Variants sit next to the original. */
export const storageKeys = {
  original: (workspaceId: string, assetId: string) => `uploads/${workspaceId}/${assetId}/original`,
  variant: (originalKey: string, name: "thumb" | "preview") => originalKey.replace(/original$/, `${name}.webp`),
  aiOutput: (workspaceId: string, assetId: string) => `ai/${workspaceId}/${assetId}/original`,
};
