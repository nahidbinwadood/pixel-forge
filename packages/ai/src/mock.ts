import { createHash } from "node:crypto";
import { ContentBlockedError } from "./errors";
import { encodePng } from "./png";
import type { AIProvider, AspectRatio, ModerationResult, WriteTextRequest } from "./types";

/** Words the mock moderator rejects, so tests can exercise the blocked path deterministically. */
const MOCK_BLOCKLIST = /\b(nsfw|nude|naked|porn|gore|behead\w*|blocked-test)\b/i;

export function dimensionsFor(ratio: AspectRatio, longEdge: number): { width: number; height: number } {
  const [w, h] = ratio.split(":").map(Number) as [number, number];
  return w >= h
    ? { width: longEdge, height: Math.round((longEdge * h) / w) }
    : { width: Math.round((longEdge * w) / h), height: longEdge };
}

function seedBytes(text: string): Buffer {
  return createHash("sha256").update(text).digest();
}

function moderate(text: string): ModerationResult {
  const hit = MOCK_BLOCKLIST.exec(text);
  return hit ? { allowed: false, reason: `Blocked term: ${hit[0].toLowerCase()}` } : { allowed: true };
}

const TEMPLATES: Record<WriteTextRequest["kind"], (topic: string, i: number) => string> = {
  caption: (t, i) =>
    [`${t}, but make it yours.`, `Fresh take on ${t} today.`, `${t}: the details matter.`, `Saving this ${t} moment.`][
      i % 4
    ] ?? t,
  hashtags: (t, i) => {
    const tag = t.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return (
      [`#${tag} #create #design`, `#${tag}daily #visuals`, `#${tag} #inspo #makeit`, `#${tag}love #studio`][i % 4] ?? ""
    );
  },
  ad_copy: (t, i) =>
    [
      `Meet ${t}. Built for the way you work.`,
      `${t}, now simpler than ever.`,
      `Try ${t} today.`,
      `${t}: less effort, more impact.`,
    ][i % 4] ?? t,
};

/**
 * Deterministic offline provider for dev and tests: same input → same output, no network.
 * Images are gradients seeded from the prompt; background removal returns the input untouched so the
 * worker's own post-processing (white → transparent) is what the user sees.
 */
export function createMockProvider(): AIProvider {
  return {
    name: "mock",
    async generateImage({ prompt, style, aspectRatio, variant }) {
      if (!moderate(prompt).allowed) throw new ContentBlockedError("Prompt blocked by provider");
      const { width, height } = dimensionsFor(aspectRatio, 512);
      const s = seedBytes(`${prompt}|${style}|${variant}`);
      const [r1 = 0, g1 = 0, b1 = 0, r2 = 0, g2 = 0, b2 = 0] = s;
      const rgba = new Uint8Array(width * height * 4);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const t = (x / width + y / height) / 2;
          const o = (y * width + x) * 4;
          rgba[o] = Math.round(r1 + (r2 - r1) * t);
          rgba[o + 1] = Math.round(g1 + (g2 - g1) * t);
          rgba[o + 2] = Math.round(b1 + (b2 - b1) * t);
          rgba[o + 3] = 255;
        }
      }
      return { data: encodePng(width, height, rgba), mimeType: "image/png" };
    },
    async editImage({ image }) {
      return { data: image.data, mimeType: image.mimeType };
    },
    async writeText({ kind, topic, count }) {
      return Array.from({ length: count }, (_, i) => TEMPLATES[kind](topic.trim(), i));
    },
    async moderateText(text) {
      return moderate(text);
    },
    async moderateImage() {
      return { allowed: true };
    },
  };
}
