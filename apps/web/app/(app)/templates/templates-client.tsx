"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/templates/filter-bar";
import { TemplateDetailDialog } from "@/components/templates/template-detail-dialog";
import { TemplateGrid } from "@/components/templates/template-grid";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import type { TemplateDetail, TemplateSummary } from "@/lib/templates";
import { useTemplatesBrowser } from "./use-templates";

export function TemplatesClient({
  categories,
  initialItems,
  initialNextCursor,
  initialFavoriteIds,
}: {
  categories: { slug: string; name: string }[];
  initialItems: TemplateSummary[];
  initialNextCursor: string | null;
  initialFavoriteIds: string[];
}) {
  const t = useTranslations("templates");
  const tc = useTranslations("common");
  const router = useRouter();
  const { filters, setFilters, items, cursor, loading, loadingMore, error, retry, loadMore } = useTemplatesBrowser({
    items: initialItems,
    nextCursor: initialNextCursor,
  });

  const [favoriteIds, setFavoriteIds] = useState(new Set(initialFavoriteIds));
  const [usingId, setUsingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TemplateDetail | null>(null);

  const toggleFavorite = useCallback(
    (id: string) => {
      const wasFavorited = favoriteIds.has(id);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(id);
        else next.add(id);
        return next;
      });
      const request = wasFavorited
        ? fetch(`/api/v1/favorites?targetType=template&targetId=${id}`, { method: "DELETE" })
        : fetch("/api/v1/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetType: "template", targetId: id }),
          });
      void request
        .then((res) => {
          if (res.ok) return;
          throw new Error();
        })
        .catch(() => {
          // revert on failure
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (wasFavorited) next.add(id);
            else next.delete(id);
            return next;
          });
          toast.error(tc("error"));
        });
    },
    [favoriteIds, tc],
  );

  const handleUse = useCallback(
    async (id: string) => {
      setUsingId(id);
      try {
        const res = await fetch(`/api/v1/templates/${id}/use`, { method: "POST" });
        if (!res.ok) throw new Error();
        const { projectId } = (await res.json()) as { projectId: string };
        track("template_used", { templateId: id });
        toast.success(t("opening"));
        router.push(`/editor/${projectId}`);
      } catch {
        toast.error(t("useFailed"));
        setUsingId(null);
      }
    },
    [router, t],
  );

  const openDetail = useCallback(async (template: TemplateSummary) => {
    track("template_viewed", { templateId: template.id });
    // Show what we already have instantly (no similar list yet), then fill in once the detail loads.
    setDetail({ ...template, similar: [] });
    try {
      const res = await fetch(`/api/v1/templates/${template.id}`);
      if (res.ok) setDetail((await res.json()) as TemplateDetail);
    } catch {
      // keep the instant preview; similar templates just won't appear
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <FilterBar categories={categories} filters={filters} onChange={setFilters} />

      {error ? (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-destructive/30 p-4 text-sm">
          {t("errorDesc")}
          <Button size="sm" variant="outline" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      ) : (
        <TemplateGrid
          // Only swap to the skeleton when there's nothing to show yet (e.g. a search that currently
          // matches nothing, still loading). Nulling `items` on *every* reload would unmount and
          // remount every card on each filter change/background revalidation, silently closing
          // anything open inside one (the premium-info dialog, a focused control).
          items={loading && items.length === 0 ? null : items}
          favoriteIds={favoriteIds}
          usingId={usingId}
          onToggleFavorite={toggleFavorite}
          onOpenDetail={(template) => void openDetail(template)}
          onUse={(id) => void handleUse(id)}
        />
      )}

      {cursor && !loading && (
        <Button variant="secondary" className="self-center" loading={loadingMore} onClick={() => void loadMore()}>
          {t("loadMore")}
        </Button>
      )}

      <TemplateDetailDialog
        template={detail}
        favoriteIds={favoriteIds}
        usingId={usingId}
        onOpenChange={(open) => !open && setDetail(null)}
        onToggleFavorite={toggleFavorite}
        onUse={(id) => void handleUse(id)}
        onOpenSimilar={(template) => void openDetail(template)}
      />
    </div>
  );
}
