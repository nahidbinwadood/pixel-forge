import { describe, expect, it } from "vitest";
import { normalizeDeclared, sniffImageType } from "./sniff";

const bytes = (...parts: (number[] | string)[]) =>
  Uint8Array.from(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

describe("sniffImageType", () => {
  it("detects each supported type", () => {
    expect(sniffImageType(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("image/png");
    expect(sniffImageType(bytes("GIF89a", [1, 0]))).toBe("image/gif");
    expect(sniffImageType(bytes("GIF87a"))).toBe("image/gif");
    expect(sniffImageType(bytes("RIFF", [0, 0, 0, 0], "WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(bytes([0, 0, 0, 0x18], "ftypheic", [0, 0]))).toBe("image/heic");
    expect(sniffImageType(bytes([0, 0, 0, 0x18], "ftypmif1"))).toBe("image/heic");
  });

  it("rejects garbage, empty and truncated input", () => {
    expect(sniffImageType(new Uint8Array())).toBeNull();
    expect(sniffImageType(bytes([0xff, 0xd8]))).toBeNull();
    expect(sniffImageType(bytes("RIFF", [0, 0, 0, 0], "WAVE"))).toBeNull();
    expect(sniffImageType(bytes([0, 0, 0, 0x18], "ftypmp42"))).toBeNull(); // MP4, not HEIC
  });

  it("ignores the claimed type: a text file named .png is not an image", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>.png"))).toBeNull();
  });
});

describe("normalizeDeclared", () => {
  it("maps heif to heic and rejects unknown types", () => {
    expect(normalizeDeclared("image/heif")).toBe("image/heic");
    expect(normalizeDeclared("image/png")).toBe("image/png");
    expect(normalizeDeclared("image/svg+xml")).toBeNull();
  });
});
