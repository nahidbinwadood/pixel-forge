/**
 * Pure URL <-> filter-object helpers shared by the server page (initial SSR fetch) and the client
 * browser hook (re-fetch on change). No "use server"/"use client" here on purpose: plain data in,
 * plain data out, importable from either side.
 */
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
