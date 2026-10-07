import { z } from "zod";

/**
 * AI job input contract, shared by the client forms, POST /api/v1/ai/jobs and the worker.
 * Option lists live here (not in packages/ai) so client bundles never pull in a provider SDK.
 */
export const ASPECT_RATIOS = ["1:1", "4:5", "3:4", "2:3", "9:16", "16:9", "3:2", "4:3"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const IMAGE_STYLES = ["none", "photo", "illustration", "3d", "anime", "watercolor", "neon"] as const;
export type ImageStyle = (typeof IMAGE_STYLES)[number];

export const WRITE_KINDS = ["caption", "hashtags", "ad_copy"] as const;
export type WriteKind = (typeof WRITE_KINDS)[number];

export const WRITE_TONES = ["friendly", "bold", "professional", "playful"] as const;
export type WriteTone = (typeof WRITE_TONES)[number];

const prompt = z.string().trim().min(3, "Describe it in a few more words").max(1000);

/** Form schema (every field required, so react-hook-form values are fully typed). */
export const textToImageForm = z.object({
  prompt,
  style: z.enum(IMAGE_STYLES),
  aspectRatio: z.enum(ASPECT_RATIOS),
  negativePrompt: z.string().trim().max(300),
  variations: z.number().int().min(1).max(4),
});

/** API schema: the form schema with defaults for API callers that omit options. */
export const textToImageInput = textToImageForm.extend({
  style: textToImageForm.shape.style.default("none"),
  aspectRatio: textToImageForm.shape.aspectRatio.default("1:1"),
  negativePrompt: textToImageForm.shape.negativePrompt.optional(),
  variations: textToImageForm.shape.variations.default(1),
});

export const bgRemoveInput = z.object({ assetId: z.string().min(1).max(64) });

export const writeForm = z.object({
  kind: z.enum(WRITE_KINDS),
  topic: z.string().trim().min(3, "Tell us a bit more").max(500),
  tone: z.enum(WRITE_TONES),
  count: z.number().int().min(1).max(5),
});

export const writeInput = writeForm.extend({
  tone: writeForm.shape.tone.default("friendly"),
  count: writeForm.shape.count.default(3),
});

export const createAIJobInput = z.discriminatedUnion("tool", [
  z.object({ tool: z.literal("text_to_image"), input: textToImageInput }),
  z.object({ tool: z.literal("bg_remove"), input: bgRemoveInput }),
  z.object({ tool: z.literal("write"), input: writeInput }),
]);
export type CreateAIJobInput = z.infer<typeof createAIJobInput>;
export type TextToImageInput = z.infer<typeof textToImageInput>;
export type BgRemoveInput = z.infer<typeof bgRemoveInput>;
export type WriteInput = z.infer<typeof writeInput>;

/** Stored in AIJob.output on success. */
export type AIJobOutput = { assetIds: string[] } | { texts: string[] };
