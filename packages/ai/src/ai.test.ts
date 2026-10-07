import type { GenerateContentResponse } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import {
  buildImagePrompt,
  ContentBlockedError,
  createGeminiProvider,
  createMockProvider,
  createProvider,
  dimensionsFor,
  type GeminiModels,
  ProviderError,
  providerConfigured,
  providerName,
} from "./index";

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47];

describe("provider selection", () => {
  it("defaults to mock", () => {
    expect(providerName({})).toBe("mock");
    expect(createProvider({}).name).toBe("mock");
  });
  it("rejects unknown providers", () => {
    expect(() => providerName({ AI_PROVIDER: "openai" })).toThrow();
    expect(providerConfigured({ AI_PROVIDER: "openai" })).toBe(false);
  });
  it("gemini needs a key", () => {
    expect(providerConfigured({ AI_PROVIDER: "gemini" })).toBe(false);
    expect(() => createProvider({ AI_PROVIDER: "gemini" })).toThrow(/GEMINI_API_KEY/);
    expect(createProvider({ AI_PROVIDER: "gemini", GEMINI_API_KEY: "k" }).name).toBe("gemini");
  });
});

describe("mock provider", () => {
  const p = createMockProvider();
  it("returns deterministic PNGs sized by aspect ratio", async () => {
    const req = { prompt: "a fox", style: "none", aspectRatio: "16:9", variant: 0 } as const;
    const a = await p.generateImage(req);
    const b = await p.generateImage(req);
    const c = await p.generateImage({ ...req, variant: 1 });
    expect([...a.data.subarray(0, 4)]).toEqual(PNG_SIG);
    expect(Buffer.from(a.data).equals(Buffer.from(b.data))).toBe(true);
    expect(Buffer.from(a.data).equals(Buffer.from(c.data))).toBe(false);
    expect(Buffer.from(a.data).readUInt32BE(16)).toBe(512);
    expect(Buffer.from(a.data).readUInt32BE(20)).toBe(288);
  });
  it("blocks listed terms in both moderation and generation", async () => {
    expect(await p.moderateText("a nude statue")).toMatchObject({ allowed: false });
    expect(await p.moderateText("a sunny beach")).toEqual({ allowed: true });
    await expect(
      p.generateImage({ prompt: "gore", style: "none", aspectRatio: "1:1", variant: 0 }),
    ).rejects.toBeInstanceOf(ContentBlockedError);
  });
  it("writes the requested number of texts", async () => {
    const out = await p.writeText({ kind: "hashtags", topic: "Cold Brew", tone: "bold", count: 3 });
    expect(out).toHaveLength(3);
    expect(out[0]).toContain("#coldbrew");
  });
});

describe("dimensionsFor", () => {
  it("keeps the long edge", () => {
    expect(dimensionsFor("9:16", 1000)).toEqual({ width: 563, height: 1000 });
    expect(dimensionsFor("1:1", 512)).toEqual({ width: 512, height: 512 });
  });
});

function fake(res: Partial<GenerateContentResponse> | Error): GeminiModels {
  return {
    generateContent: vi.fn(async () => {
      if (res instanceof Error) throw res;
      return res as GenerateContentResponse;
    }),
  };
}

describe("gemini adapter", () => {
  const imageReq = { prompt: "a fox", style: "photo", aspectRatio: "1:1", variant: 0 } as const;

  it("extracts inline image data and sends aspect ratio", async () => {
    const models = fake({
      candidates: [{ content: { parts: [{ text: "here" }, { inlineData: { data: "AQID", mimeType: "image/png" } }] } }],
    });
    const p = createGeminiProvider({ apiKey: "k", models });
    const img = await p.generateImage(imageReq);
    expect([...img.data]).toEqual([1, 2, 3]);
    expect(models.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.1-flash-image",
        config: expect.objectContaining({ imageConfig: { aspectRatio: "1:1" } }),
      }),
    );
  });

  it("maps safety finish reasons to ContentBlockedError", async () => {
    const p = createGeminiProvider({
      apiKey: "k",
      models: fake({ candidates: [{ finishReason: "IMAGE_SAFETY" as never }] }),
    });
    await expect(p.generateImage(imageReq)).rejects.toBeInstanceOf(ContentBlockedError);
  });

  it("treats a text-only answer as retryable", async () => {
    const p = createGeminiProvider({
      apiKey: "k",
      models: fake({ candidates: [{ content: { parts: [{ text: "no" }] } }] }),
    });
    await expect(p.generateImage(imageReq)).rejects.toMatchObject({ name: "ProviderError", retryable: true });
  });

  it("wraps unknown errors as retryable ProviderError", async () => {
    const p = createGeminiProvider({ apiKey: "k", models: fake(new Error("socket hang up")) });
    await expect(p.writeText({ kind: "caption", topic: "x", tone: "bold", count: 1 })).rejects.toBeInstanceOf(
      ProviderError,
    );
  });

  it("moderation returns blocked when Gemini blocks the classifier prompt", async () => {
    const p = createGeminiProvider({
      apiKey: "k",
      models: fake({ promptFeedback: { blockReason: "SAFETY" as never } }),
    });
    expect(await p.moderateText("bad")).toMatchObject({ allowed: false });
  });

  it("builds prompts with style and negative prompt", () => {
    expect(buildImagePrompt(" fox ", "neon", "text")).toBe(
      "fox\nVivid neon glow, dark background, high contrast.\nAvoid: text.",
    );
  });
});
