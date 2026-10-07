/**
 * Pure URL <-> filter-object helpers shared by the server page (initial SSR fetch) and the client
 * browser hook (re-fetch on change). No "use server"/"use client" here on purpose: plain data in,
 * plain data out, importable from either side.
 */

/**
 * Size presets for the filter UI. Duplicated (intentionally) from packages/db/src/seed-content.ts:
 * that package can't be imported from apps/web's dependency graph for app code (seed-only), and the
 * two were built in parallel worktrees. Fold into packages/shared at merge time (see that file's note).
 *
 * Lives here (not lib/templates.ts) because client components (filter-bar, admin forms) need it and
 * lib/templates.ts is `server-only` (it imports prisma, which pulls Node core modules into any client
 * bundle that reaches it transitively).
 */
export const SIZE_PRESETS = [
  { id: "instagram_post", label: "Instagram post", width: 1080, height: 1080 },
  { id: "instagram_story", label: "Instagram story", width: 1080, height: 1920 },
  { id: "facebook_post", label: "Facebook post", width: 1200, height: 630 },
  { id: "youtube_thumbnail", label: "YouTube thumbnail", width: 1280, height: 720 },
  { id: "pinterest_pin", label: "Pinterest pin", width: 1000, height: 1500 },
  { id: "business_card", label: "Business card", width: 1050, height: 600 },
  { id: "flyer_letter", label: "Flyer", width: 1700, height: 2200 },
  { id: "poster", label: "Poster", width: 1800, height: 2700 },
  { id: "presentation_16_9", label: "Presentation", width: 1920, height: 1080 },
  { id: "resume_a4", label: "Resume (A4)", width: 1240, height: 1754 },
  { id: "invitation", label: "Invitation", width: 1200, height: 1800 },
  { id: "product_square", label: "Product photo", width: 1000, height: 1000 },
  { id: "banner_ad", label: "Banner ad", width: 1200, height: 628 },
] as const;

export interface TemplateFilters {
  q: string;
  category: string;
  sizePreset: string;
  style: string;
  color: string;
  premium: boolean;
}

export const EMPTY_FILTERS: TemplateFilters = {
  q: "",
  category: "",
  sizePreset: "",
  style: "",
  color: "",
  premium: false,
};

export function filtersFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): TemplateFilters {
  const get = (key: string): string => {
    if (params instanceof URLSearchParams) return params.get(key) ?? "";
    const v = params[key];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };
  return {
    q: get("q"),
    category: get("category"),
    sizePreset: get("size"),
    style: get("style"),
    color: get("color"),
    premium: get("premium") === "true",
  };
}

export function filtersToUrlQuery(filters: TemplateFilters): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.category) sp.set("category", filters.category);
  if (filters.sizePreset) sp.set("size", filters.sizePreset);
  if (filters.style) sp.set("style", filters.style);
  if (filters.color) sp.set("color", filters.color);
  if (filters.premium) sp.set("premium", "true");
  return sp.toString();
}
