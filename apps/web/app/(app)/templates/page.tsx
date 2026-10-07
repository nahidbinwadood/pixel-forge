import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/api";
import { filtersFromSearchParams } from "@/lib/template-filters";
import { listFavoriteTemplateIds, listTemplateCategories, listTemplates } from "@/lib/templates";
import { TemplatesClient } from "./templates-client";

export const metadata: Metadata = { title: "Templates" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [user, t, resolvedSearchParams] = await Promise.all([
    requireUser(),
    getTranslations("templates"),
    searchParams,
  ]);
  const filters = filtersFromSearchParams(resolvedSearchParams);

  const [categories, page, favoriteIds] = await Promise.all([
    listTemplateCategories(),
    listTemplates({
      q: filters.q || undefined,
      category: filters.category || undefined,
      sizePreset: filters.sizePreset || undefined,
      style: filters.style || undefined,
      color: filters.color || undefined,
      premium: filters.premium || undefined,
    }),
    listFavoriteTemplateIds(user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <TemplatesClient
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        initialItems={page.items}
        initialNextCursor={page.nextCursor}
        initialFavoriteIds={favoriteIds}
      />
    </div>
  );
}
