import { describe, expect, it } from "vitest";
import { failedPasswordRules, passwordSchema } from "./password";

describe("password policy", () => {
  it("accepts a password meeting every rule", () => {
    expect(passwordSchema.safeParse("Ab1!xy").success).toBe(true);
    expect(failedPasswordRules("Ab1!xy")).toEqual([]);
  });
  it("reports each missing rule", () => {
    expect(failedPasswordRules("")).toEqual(["length", "upper", "lower", "number", "special"]);
    expect(failedPasswordRules("abcdef")).toEqual(["upper", "number", "special"]);
    expect(failedPasswordRules("ABCDEF1!")).toEqual(["lower"]);
    expect(failedPasswordRules("Abcdef1")).toEqual(["special"]);
    expect(failedPasswordRules("Ab1!x")).toEqual(["length"]);
  });
  it("treats spaces and unicode punctuation as special", () => {
    expect(failedPasswordRules("Ab1 xy")).toEqual([]);
    expect(failedPasswordRules("Ab1€xy")).toEqual([]);
  });
  it("rejects overly long input", () => {
    expect(passwordSchema.safeParse(`Aa1!${"x".repeat(200)}`).success).toBe(false);
  });
});
