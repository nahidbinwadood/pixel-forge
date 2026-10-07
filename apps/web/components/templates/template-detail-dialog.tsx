"use client";

import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TemplateDetail, TemplateSummary } from "@/lib/templates";

export function TemplateDetailDialog({
  template,
  favoriteIds,
  usingId,
  onOpenChange,
  onToggleFavorite,
  onUse,
  onOpenSimilar,
}: {
  template: TemplateDetail | null;
  favoriteIds: Set<string>;
  usingId: string | null;
  onOpenChange: (open: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onUse: (id: string) => void;
  onOpenSimilar: (template: TemplateSummary) => void;
}) {
  const t = useTranslations("templates");
  const favorited = template ? favoriteIds.has(template.id) : false;

  return (
    <Dialog open={template !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {template && (
          <>
            <DialogHeader>
              <DialogTitle>{template.title}</DialogTitle>
              {template.description && <DialogDescription>{template.description}</DialogDescription>}
            </DialogHeader>

            <div
              className="overflow-hidden rounded-xl border bg-surface-2"
              style={{ aspectRatio: `${template.width} / ${template.height}`, maxHeight: "45vh" }}
            >
              {/* biome-ignore lint/performance/noImgElement: generated SVG data: URL, not optimizable by next/image */}
              <img src={template.previewDataUrl} alt={template.title} className="size-full object-contain" />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-text-2">
              <Badge variant="outline">{template.categoryName}</Badge>
              <Badge variant="outline">
                {template.width}×{template.height}
              </Badge>
              {template.premium && <Badge variant="premium">{t("premiumBadge")}</Badge>}
              {template.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button className="flex-1" loading={usingId === template.id} onClick={() => onUse(template.id)}>
                {t("useTemplate")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={favorited ? t("unfavorite") : t("favorite")}
                aria-pressed={favorited}
                onClick={() => onToggleFavorite(template.id)}
              >
                <HeartIcon className={favorited ? "fill-current text-destructive" : ""} />
              </Button>
            </div>

            {template.similar.length > 0 && (
              <div className="grid gap-2">
                <h3 className="font-display text-sm font-semibold text-text-2">{t("similar")}</h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {template.similar.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onOpenSimilar(s)}
                      className="w-28 shrink-0 overflow-hidden rounded-lg border focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                      style={{ aspectRatio: `${s.width} / ${s.height}` }}
                    >
                      {/* biome-ignore lint/performance/noImgElement: generated SVG data: URL */}
                      <img src={s.previewDataUrl} alt={s.title} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
