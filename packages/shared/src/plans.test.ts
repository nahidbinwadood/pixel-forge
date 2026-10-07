import { describe, expect, it } from "vitest";
import { canAfford, jobCost, PLANS } from "./plans";

describe("credits", () => {
  it("charges per variation only for text_to_image", () => {
    expect(jobCost("text_to_image", 4)).toBe(8);
    expect(jobCost("bg_remove", 4)).toBe(1);
  });
  it("rejects bad variation counts", () => {
    expect(() => jobCost("text_to_image", 0)).toThrow(RangeError);
    expect(() => jobCost("text_to_image", 5)).toThrow(RangeError);
    expect(() => jobCost("text_to_image", 1.5)).toThrow(RangeError);
  });
  it("blocks jobs the balance cannot cover", () => {
    expect(canAfford(2, "text_to_image", 1)).toBe(true);
    expect(canAfford(3, "text_to_image", 2)).toBe(false);
  });
  it("only free plan watermarks", () => {
    expect(
      Object.values(PLANS)
        .filter((p) => p.watermark)
        .map((p) => p.id),
    ).toEqual(["free"]);
  });
});
