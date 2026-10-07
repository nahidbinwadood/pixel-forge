import { describe, expect, it } from "vitest";
import { historySummary, nextRefillDate } from "./summary";

describe("historySummary", () => {
  it("uses the prompt or topic, collapsed and truncated", () => {
    expect(historySummary("text_to_image", { prompt: "  a   fox\nin snow " })).toBe("a fox in snow");
    expect(historySummary("write", { topic: "x".repeat(200) })).toHaveLength(120);
  });
  it("labels tools without text", () => {
    expect(historySummary("bg_remove", { assetId: "a" })).toBe("Background removal");
    expect(historySummary("text_to_image", null)).toBe("text_to_image");
  });
});

describe("nextRefillDate", () => {
  it("is the 1st of next month in UTC, across year end", () => {
    expect(nextRefillDate(new Date("2026-10-07T12:00:00Z")).toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(nextRefillDate(new Date("2026-12-31T23:00:00Z")).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
