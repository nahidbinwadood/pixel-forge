import { describe, expect, it } from "vitest";
import { detectMime } from "./upload";

describe("detectMime", () => {
  it("accepts allowed declared types", () => {
    expect(detectMime({ type: "image/png", name: "a.png" })).toBe("image/png");
    expect(detectMime({ type: "image/jpg", name: "a.jpg" })).toBe("image/jpeg");
  });
  it("falls back to extension only for HEIC with an empty type", () => {
    expect(detectMime({ type: "", name: "IMG_1.HEIC" })).toBe("image/heic");
    expect(detectMime({ type: "", name: "evil.png" })).toBeNull();
  });
  it("rejects everything else", () => {
    expect(detectMime({ type: "image/svg+xml", name: "a.svg" })).toBeNull();
    expect(detectMime({ type: "application/pdf", name: "a.pdf" })).toBeNull();
  });
});
