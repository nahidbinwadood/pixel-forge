import { describe, expect, it } from "vitest";
import { bucket, evaluate } from "./flag-rules";

const flag = (enabled: boolean, rules: unknown = null) => ({ key: "f", enabled, rules });
const user = { id: "u1", role: "user" };

describe("flag rules", () => {
  it("off always loses; no rules means everyone", () => {
    expect(evaluate(flag(false), user)).toBe(false);
    expect(evaluate(flag(true), null)).toBe(true);
  });
  it("targeted flags need a matching user", () => {
    expect(evaluate(flag(true, { roles: ["admin"] }), null)).toBe(false);
    expect(evaluate(flag(true, { roles: ["admin"] }), user)).toBe(false);
    expect(evaluate(flag(true, { roles: ["admin"] }), { id: "a", role: "admin" })).toBe(true);
    expect(evaluate(flag(true, { userIds: ["u1"] }), user)).toBe(true);
  });
  it("percent rollout is stable and bounded", () => {
    expect(evaluate(flag(true, { percent: 0 }), user)).toBe(false);
    expect(evaluate(flag(true, { percent: 100 }), user)).toBe(true);
    expect(bucket("u1", "f")).toBe(bucket("u1", "f"));
    const on = Array.from({ length: 1000 }, (_, i) => evaluate(flag(true, { percent: 30 }), { id: `u${i}` }));
    const share = on.filter(Boolean).length / 1000;
    expect(share).toBeGreaterThan(0.25);
    expect(share).toBeLessThan(0.35);
  });
});
