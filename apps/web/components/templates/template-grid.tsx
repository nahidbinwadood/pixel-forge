"use client";

import { LayoutTemplateIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { TemplateSummary } from "@/lib/templates";
import { TemplateCard } from "./template-card";

export function TemplateGrid({
  items,
  favoriteIds,
  usingId,
  onToggleFavorite,
  onOpenDetail,
  onUse,
}: {
  items: TemplateSummary[] | null;
  favoriteIds: Set<string>;
  usingId: string | null;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (template: TemplateSummary) => void;
  onUse: (id: string) => void;
}) {
  const t = useTranslations("templates");

  if (items === null) {
    return (
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4" aria-busy="true">
        {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"].map((k, i) => (
          <Skeleton
            key={k}
            className="w-full rounded-2xl shimmer"
            style={{ aspectRatio: i % 3 === 0 ? "1/1" : "4/5" }}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState icon={<LayoutTemplateIcon />} title={t("empty")} description={t("emptyDesc")} />;
  }

  return (
    <ul aria-label={t("title")} className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>li]:mb-4">
      <AnimatePresence initial={false}>
        {items.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            favorited={favoriteIds.has(template.id)}
            using={usingId === template.id}
            onToggleFavorite={() => onToggleFavorite(template.id)}
            onOpenDetail={() => onOpenDetail(template)}
            onUse={() => onUse(template.id)}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
