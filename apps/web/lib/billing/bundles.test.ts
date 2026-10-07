import { afterEach, describe, expect, it, vi } from "vitest";
import { bundlePriceId, CREDIT_BUNDLES, findBundle } from "./bundles";

describe("billing/bundles", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("every configured bundle has positive credits and price", () => {
    for (const bundle of CREDIT_BUNDLES) {
      expect(bundle.credits).toBeGreaterThan(0);
      expect(bundle.priceUsd).toBeGreaterThan(0);
    }
  });

  it("findBundle looks up by id, undefined for unknown ids", () => {
    expect(findBundle("pro")?.credits).toBe(500);
    expect(findBundle("nope")).toBeUndefined();
  });

  it("bundlePriceId reads the env var named after the bundle", () => {
    expect(bundlePriceId("starter")).toBeUndefined();
    vi.stubEnv("STRIPE_PRICE_CREDITS_STARTER", "price_starter");
    expect(bundlePriceId("starter")).toBe("price_starter");
  });
});
