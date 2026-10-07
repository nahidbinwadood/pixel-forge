import { ApiError, requireUser, route } from "@/lib/api";
import { setThumbnail } from "@/lib/projects";
import { THUMBNAIL_MAX_BYTES, THUMBNAIL_TYPES } from "@/lib/projects-schema";
import { rateLimit } from "@/lib/rate-limit";

const MAGIC: Record<(typeof THUMBNAIL_TYPES)[number], (b: Uint8Array) => boolean> = {
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8,
  "image/webp": (b) => String.fromCharCode(...b.slice(8, 12)) === "WEBP",
};

/**
 * Raw image body (≤ 512 KB) rendered by the editor from page 1. Stored server-side under a fixed key per
 * design, so it never counts as a user upload and needs no worker pass.
 */
export const PUT = route<{ id: string }>(async (req, { id }) => {
  const user = await requireUser();
  await rateLimit(`project-thumb:${user.id}`, 60, 60);
  const type = THUMBNAIL_TYPES.find((t) => t === req.headers.get("content-type"));
  if (!type) throw new ApiError(415, "UNSUPPORTED_TYPE", "Thumbnails must be PNG, WebP or JPEG");
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > THUMBNAIL_MAX_BYTES) {
    throw new ApiError(413, "TOO_LARGE", "Thumbnail is empty or too large");
  }
  if (!MAGIC[type](bytes)) throw new ApiError(415, "UNSUPPORTED_TYPE", "File content does not match its type");
  await setThumbnail(user.id, id, bytes, type);
  return new Response(null, { status: 204 });
});
