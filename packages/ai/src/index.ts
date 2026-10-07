import { createGeminiProvider } from "./gemini";
import { createMockProvider } from "./mock";
import type { AIProvider } from "./types";

export { ContentBlockedError, isRetryableStatus, ProviderError } from "./errors";
export { buildImagePrompt, buildWritePrompt, createGeminiProvider, GEMINI_DEFAULTS, type GeminiModels } from "./gemini";
export { createMockProvider, dimensionsFor } from "./mock";
export { encodePng } from "./png";
export * from "./types";

/** Instruction sent to the image model for background removal; the worker then keys out the white. */
export const REMOVE_BG_INSTRUCTION =
  "Isolate the main subject of this image. Keep the subject exactly as it is (same pose, colors, details, framing) " +
  "and replace everything else with a pure solid white (#FFFFFF) background. No shadows, no border, no text.";

type Env = Record<string, string | undefined>;

export type ProviderName = AIProvider["name"];

/** Which provider the env asks for. Gemini without a key is a config error, not a silent fallback. */
export function providerName(env: Env = process.env): ProviderName {
  const v = (env.AI_PROVIDER ?? "mock").trim().toLowerCase();
  if (v === "mock" || v === "gemini") return v;
  throw new Error(`AI_PROVIDER must be "mock" or "gemini", got "${v}"`);
}

/** True when the configured provider can actually run (used by the UI to say so honestly). */
export function providerConfigured(env: Env = process.env): boolean {
  try {
    return providerName(env) === "mock" || Boolean(env.GEMINI_API_KEY);
  } catch {
    return false;
  }
}

export function createProvider(env: Env = process.env): AIProvider {
  if (providerName(env) === "mock") return createMockProvider();
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("AI_PROVIDER=gemini requires GEMINI_API_KEY");
  return createGeminiProvider({ apiKey, textModel: env.GEMINI_TEXT_MODEL, imageModel: env.GEMINI_IMAGE_MODEL });
}
