import { afterEach, describe, expect, it, vi } from "vitest";
import { hasAnyPlanPrice, planForPriceId, planPriceId } from "./prices";

describe("billing/prices", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the env var named after the plan and interval", () => {
    vi.stubEnv("STRIPE_PRICE_PLUS_MONTHLY", "price_plus_m");
    vi.stubEnv("STRIPE_PRICE_PLUS_YEARLY", "price_plus_y");
    expect(planPriceId("plus", "monthly")).toBe("price_plus_m");
    expect(planPriceId("plus", "yearly")).toBe("price_plus_y");
    expect(planPriceId("pro", "monthly")).toBeUndefined();
  });

  it("hasAnyPlanPrice is true once any paid plan has a price configured", () => {
    expect(hasAnyPlanPrice()).toBe(false);
    vi.stubEnv("STRIPE_PRICE_TEAM_YEARLY", "price_team_y");
    expect(hasAnyPlanPrice()).toBe(true);
  });

  it("planForPriceId reverses the lookup, and is undefined for an unknown price", () => {
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro_m");
    expect(planForPriceId("price_pro_m")).toEqual({ planId: "pro", interval: "monthly" });
    expect(planForPriceId("price_unknown")).toBeUndefined();
  });
});
