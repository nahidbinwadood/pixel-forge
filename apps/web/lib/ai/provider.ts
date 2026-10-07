import "server-only";
import { type AIProvider, createProvider, providerConfigured, providerName } from "@pixelforge/ai";

const g = globalThis as unknown as { aiProvider?: AIProvider };

/** One provider per server instance: prompt moderation in the request, generation in `lib/jobs/run.ts`. */
export function aiProvider(): AIProvider {
  g.aiProvider ??= createProvider();
  return g.aiProvider;
}

/** Status for the UI: say plainly when AI is in demo mode or not configured. */
export function aiStatus(): { provider: "mock" | "gemini" | "invalid"; ready: boolean } {
  let provider: "mock" | "gemini" | "invalid";
  try {
    provider = providerName();
  } catch {
    provider = "invalid";
  }
  return { provider, ready: providerConfigured() };
}
