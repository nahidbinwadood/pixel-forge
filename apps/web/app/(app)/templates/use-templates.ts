"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { filtersFromSearchParams, filtersToUrlQuery, type TemplateFilters } from "@/lib/template-filters";
import type { TemplateSummary } from "@/lib/templates";

export type { TemplateFilters };

async function fetchPage(filters: TemplateFilters, cursor?: string) {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.category) sp.set("category", filters.category);
  if (filters.sizePreset) sp.set("sizePreset", filters.sizePreset);
  if (filters.style) sp.set("style", filters.style);
  if (filters.color) sp.set("color", filters.color);
  if (filters.premium) sp.set("premium", "true");
  if (cursor) sp.set("cursor", cursor);
  const res = await fetch(`/api/v1/templates?${sp.toString()}`);
  if (!res.ok) throw new Error("templates request failed");
  return (await res.json()) as { items: TemplateSummary[]; nextCursor: string | null };
}

/**
 * Templates browser state: filters are URL state (shareable, back/forward works), results are
 * client state re-fetched whenever filters change. The server page's first page seeds initial
 * state so there's no loading flash on first paint.
 */
export function useTemplatesBrowser(initial: { items: TemplateSummary[]; nextCursor: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);

  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const skipNextFetch = useRef(true);

  const reload = useCallback(async (f: TemplateFilters) => {
    setLoading(true);
    setError(false);
    try {
      const page = await fetchPage(f);
      setItems(page.items);
      setCursor(page.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keyed on the query *string*, not the `searchParams` object: `useSearchParams()` can hand out a
  // new identity on a render that didn't actually change the query, and depending on the object
  // itself would re-run this effect (and re-fetch) for no real filter change.
  const queryString = searchParams.toString();
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on queryString, not searchParams (see comment above)
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    void reload(filtersFromSearchParams(searchParams));
  }, [reload, queryString]);

  const setFilters = useCallback(
    (next: Partial<TemplateFilters>) => {
      const merged = { ...filtersFromSearchParams(searchParams), ...next };
      const qs = filtersToUrlQuery(merged);
      router.replace(qs ? `/templates?${qs}` : "/templates", { scroll: false });
    },
    [router, searchParams],
  );

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(filters, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, filters]);

  return {
    filters,
    setFilters,
    items,
    cursor,
    loading,
    loadingMore,
    error,
    retry: () => void reload(filters),
    loadMore,
  };
}
