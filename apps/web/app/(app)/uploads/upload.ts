import { UPLOAD_MIME_TYPES, type UploadMimeType } from "@pixelforge/shared";

/** Windows/Firefox often report HEIC as "" — fall back to the extension. */
export function detectMime(file: { type: string; name: string }): UploadMimeType | null {
  const declared = file.type.toLowerCase();
  if ((UPLOAD_MIME_TYPES as readonly string[]).includes(declared)) return declared as UploadMimeType;
  if (declared === "image/jpg") return "image/jpeg";
  const ext = file.name.toLowerCase().split(".").pop();
  if (!declared && (ext === "heic" || ext === "heif")) return "image/heic";
  return null;
}

export class UploadError extends Error {}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new UploadError(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** presign → PUT straight to storage → complete. Returns the asset id (status: processing). */
export async function uploadFile(file: File, maxMb: number, unsupported: string): Promise<string> {
  const mimeType = detectMime(file);
  if (!mimeType) throw new UploadError(unsupported);
  if (file.size > maxMb * 1024 * 1024) throw new UploadError(`Max ${maxMb} MB`);

  const { assetId, uploadUrl, headers } = await api<{
    assetId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  }>("/api/v1/uploads", { method: "POST", body: JSON.stringify({ filename: file.name, mimeType, bytes: file.size }) });
  const put = await fetch(uploadUrl, { method: "PUT", headers, body: file });
  if (!put.ok) throw new UploadError(`Storage rejected the upload (${put.status})`);
  await api(`/api/v1/uploads/${assetId}/complete`, { method: "POST" });
  return assetId;
}
