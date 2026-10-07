/**
 * Capability interfaces (ARCHITECTURE §3). An adapter implements all of them; call sites depend only on these
 * types, so swapping Gemini for another vendor never touches the API or worker.
 */

import type { AspectRatio, ImageStyle, WriteKind, WriteTone } from "@pixelforge/shared";

export {
  ASPECT_RATIOS,
  type AspectRatio,
  IMAGE_STYLES,
  type ImageStyle,
  WRITE_KINDS,
  WRITE_TONES,
  type WriteKind,
  type WriteTone,
} from "@pixelforge/shared";

export interface ImageData {
  data: Uint8Array;
  mimeType: string;
}

export interface GenerateImageRequest {
  prompt: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
  negativePrompt?: string;
  /** Variation index, so N variations of the same prompt differ. */
  variant: number;
  signal?: AbortSignal;
}

export interface EditImageRequest {
  image: ImageData;
  instruction: string;
  signal?: AbortSignal;
}

export interface WriteTextRequest {
  kind: WriteKind;
  topic: string;
  tone: WriteTone;
  count: number;
  signal?: AbortSignal;
}

export type ModerationResult = { allowed: true } | { allowed: false; reason: string };

export interface ImageGenerator {
  generateImage(req: GenerateImageRequest): Promise<ImageData>;
}
export interface ImageEditor {
  editImage(req: EditImageRequest): Promise<ImageData>;
}
export interface TextWriter {
  writeText(req: WriteTextRequest): Promise<string[]>;
}
export interface Moderator {
  moderateText(text: string, signal?: AbortSignal): Promise<ModerationResult>;
  moderateImage(image: ImageData, signal?: AbortSignal): Promise<ModerationResult>;
}

export interface AIProvider extends ImageGenerator, ImageEditor, TextWriter, Moderator {
  readonly name: "mock" | "gemini";
}
