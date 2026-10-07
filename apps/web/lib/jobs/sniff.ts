export type SniffedType = "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/heic";

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);

const ascii = (buf: Uint8Array, start: number, end: number) => String.fromCharCode(...buf.subarray(start, end));
const startsWith = (buf: Uint8Array, bytes: number[]) => bytes.every((b, i) => buf[i] === b);

/** Detect image type from magic bytes. Never trusts filename or declared Content-Type. */
export function sniffImageType(buf: Uint8Array): SniffedType | null {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (buf.length >= 6 && (ascii(buf, 0, 6) === "GIF87a" || ascii(buf, 0, 6) === "GIF89a")) return "image/gif";
  if (buf.length >= 12 && ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return "image/webp";
  if (buf.length >= 12 && ascii(buf, 4, 8) === "ftyp" && HEIC_BRANDS.has(ascii(buf, 8, 12))) return "image/heic";
  return null;
}

/** Declared upload type → sniffed type it must match (HEIF is the HEIC container). */
export function normalizeDeclared(mime: string): SniffedType | null {
  if (mime === "image/heif") return "image/heic";
  return (
    (["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"] as const).find((t) => t === mime) ?? null
  );
}
