import { ContentBlockedError, ProviderError } from "@pixelforge/ai";
import { describe, expect, it } from "vitest";
import { classifyFailure } from "./outcome";

describe("classifyFailure", () => {
  it("blocks immediately on content policy", () => {
    expect(classifyFailure(new ContentBlockedError("x"), 0, 4).kind).toBe("blocked");
  });
  it("fails immediately on permanent provider errors", () => {
    expect(classifyFailure(new ProviderError("400", false), 0, 4).kind).toBe("failed");
  });
  it("retries transient errors until the last attempt", () => {
    expect(classifyFailure(new ProviderError("503", true), 0, 4).kind).toBe("retry");
    expect(classifyFailure(new Error("ECONNRESET"), 2, 4).kind).toBe("retry");
    expect(classifyFailure(new ProviderError("503", true), 3, 4).kind).toBe("failed");
  });
});
