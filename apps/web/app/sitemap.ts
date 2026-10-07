import type { MetadataRoute } from "next";

const STATIC_PATHS = [
  "",
  "/pricing",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
  "/dmca",
  "/ai-policy",
  "/tools/photo-editor",
  "/tools/background-remover",
  "/tools/ai-image-generator",
  "/tools/templates",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const now = new Date();
  return STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
