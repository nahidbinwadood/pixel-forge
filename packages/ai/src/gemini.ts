import { ApiError, type GenerateContentParameters, type GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { ContentBlockedError, isRetryableStatus, ProviderError } from "./errors";
import type { AIProvider, ImageData, ImageStyle, ModerationResult, WriteKind, WriteTone } from "./types";

/** Defaults checked against ai.google.dev/gemini-api/docs/models (2026-10). Override via env. */
export const GEMINI_DEFAULTS = {
  textModel: "gemini-3.8-flash",
  imageModel: "gemini-3.1-flash-image",
} as const;

/** The slice of the SDK we use, so tests can inject a fake. */
export interface GeminiModels {
  generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse>;
}

export interface GeminiOptions {
  apiKey: string;
  textModel?: string;
  imageModel?: string;
  /** Test seam; defaults to the real SDK client. */
  models?: GeminiModels;
}

const BLOCK_FINISH = new Set([
  "SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
  "IMAGE_SAFETY",
  "IMAGE_PROHIBITED_CONTENT",
  "RECITATION",
]);

const STYLE_HINTS: Record<ImageStyle, string> = {
  none: "",
  photo: "Photorealistic photograph, natural light, sharp focus.",
  illustration: "Clean flat vector illustration.",
  "3d": "Soft 3D render, studio lighting.",
  anime: "Anime illustration style.",
  watercolor: "Watercolor painting on textured paper.",
  neon: "Vivid neon glow, dark background, high contrast.",
};

const WRITE_BRIEFS: Record<WriteKind, string> = {
  caption: "short social media captions (max 200 characters each, no hashtags)",
  hashtags: "lines of 5-8 relevant hashtags each, space-separated, each starting with #",
  ad_copy: "punchy ad headlines with one supporting sentence (max 180 characters each)",
};

const MODERATION_POLICY =
  "You are a content-safety classifier for a consumer design app. Disallow: sexual content involving minors, " +
  "explicit sexual content or nudity, graphic violence or gore, hate or harassment targeting protected groups, " +
  "self-harm encouragement, instructions for weapons or crime, and realistic depictions of real private individuals. " +
  "Everything else is allowed. Respond only with the JSON object.";

const MODERATION_SCHEMA = {
  type: "object",
  properties: { allowed: { type: "boolean" }, reason: { type: "string" } },
  required: ["allowed", "reason"],
};

/** Throws ContentBlockedError when Gemini's own safety system stopped the request or response. */
function assertNotBlocked(res: GenerateContentResponse): void {
  const blocked = res.promptFeedback?.blockReason;
  if (blocked) throw new ContentBlockedError(`Prompt blocked by provider (${blocked})`);
  const finish = res.candidates?.[0]?.finishReason;
  if (finish && BLOCK_FINISH.has(finish)) throw new ContentBlockedError(`Output blocked by provider (${finish})`);
}

function firstImage(res: GenerateContentResponse): ImageData {
  assertNotBlocked(res);
  for (const part of res.candidates?.[0]?.content?.parts ?? []) {
    const d = part.inlineData;
    if (d?.data && d.mimeType?.startsWith("image/")) {
      return { data: Buffer.from(d.data, "base64"), mimeType: d.mimeType };
    }
  }
  // The model occasionally answers with text only; a retry usually succeeds.
  throw new ProviderError("Model returned no image", true);
}

function parseJson<T>(res: GenerateContentResponse): T {
  assertNotBlocked(res);
  const text = res.text;
  if (!text) throw new ProviderError("Model returned no text", true);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ProviderError("Model returned malformed JSON", true);
  }
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ContentBlockedError || e instanceof ProviderError) throw e;
    if (e instanceof ApiError) throw new ProviderError(`Gemini ${e.status}: ${e.message}`, isRetryableStatus(e.status));
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError" || name === "TimeoutError") throw new ProviderError("Gemini request timed out", true);
    throw new ProviderError(`Gemini call failed: ${e instanceof Error ? e.message : String(e)}`, true);
  }
}

export function buildImagePrompt(prompt: string, style: ImageStyle, negativePrompt?: string): string {
  return [prompt.trim(), STYLE_HINTS[style], negativePrompt?.trim() ? `Avoid: ${negativePrompt.trim()}.` : ""]
    .filter(Boolean)
    .join("\n");
}

export function buildWritePrompt(kind: WriteKind, topic: string, tone: WriteTone, count: number): string {
  return `Write ${count} distinct ${WRITE_BRIEFS[kind]} in a ${tone} tone about: ${topic.trim()}\nReturn a JSON array of ${count} strings.`;
}

export function createGeminiProvider(opts: GeminiOptions): AIProvider {
  const models = opts.models ?? new GoogleGenAI({ apiKey: opts.apiKey }).models;
  const textModel = opts.textModel || GEMINI_DEFAULTS.textModel;
  const imageModel = opts.imageModel || GEMINI_DEFAULTS.imageModel;

  async function classify(parts: GenerateContentParameters["contents"], signal?: AbortSignal) {
    try {
      const r = await call(async () =>
        parseJson<{ allowed?: unknown; reason?: unknown }>(
          await models.generateContent({
            model: textModel,
            contents: parts,
            config: {
              systemInstruction: MODERATION_POLICY,
              responseMimeType: "application/json",
              responseJsonSchema: MODERATION_SCHEMA,
              abortSignal: signal,
            },
          }),
        ),
      );
      return r.allowed === true
        ? ({ allowed: true } as const)
        : ({ allowed: false, reason: typeof r.reason === "string" ? r.reason : "Flagged by moderation" } as const);
    } catch (e) {
      if (e instanceof ContentBlockedError) return { allowed: false, reason: e.message } as const;
      throw e;
    }
  }

  return {
    name: "gemini",
    async generateImage({ prompt, style, aspectRatio, negativePrompt, signal }) {
      return call(async () =>
        firstImage(
          await models.generateContent({
            model: imageModel,
            contents: buildImagePrompt(prompt, style, negativePrompt),
            config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio }, abortSignal: signal },
          }),
        ),
      );
    },
    async editImage({ image, instruction, signal }) {
      return call(async () =>
        firstImage(
          await models.generateContent({
            model: imageModel,
            contents: [
              { inlineData: { data: Buffer.from(image.data).toString("base64"), mimeType: image.mimeType } },
              { text: instruction },
            ],
            config: { responseModalities: ["IMAGE"], abortSignal: signal },
          }),
        ),
      );
    },
    async writeText({ kind, topic, tone, count, signal }) {
      const out = await call(async () =>
        parseJson<unknown>(
          await models.generateContent({
            model: textModel,
            contents: buildWritePrompt(kind, topic, tone, count),
            config: {
              responseMimeType: "application/json",
              responseJsonSchema: { type: "array", items: { type: "string" }, minItems: count, maxItems: count },
              abortSignal: signal,
            },
          }),
        ),
      );
      if (!Array.isArray(out)) throw new ProviderError("Model returned unexpected shape", true);
      return out
        .filter((s): s is string => typeof s === "string" && s.trim() !== "")
        .slice(0, count)
        .map((s) => s.trim());
    },
    async moderateText(text, signal): Promise<ModerationResult> {
      return classify(`Classify this user prompt:\n"""${text}"""`, signal);
    },
    async moderateImage(image, signal): Promise<ModerationResult> {
      return classify(
        [
          { inlineData: { data: Buffer.from(image.data).toString("base64"), mimeType: image.mimeType } },
          { text: "Classify this generated image." },
        ],
        signal,
      );
    },
  };
}
