"use client";

import { HeartIcon } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { liftHover, listItem } from "@/lib/motion";
import type { TemplateSummary } from "@/lib/templates";
import { PremiumInfoDialog } from "./premium-info-dialog";

export function TemplateCard({
  template,
  favorited,
  onToggleFavorite,
  onOpenDetail,
  onUse,
  using,
}: {
  template: TemplateSummary;
  favorited: boolean;
  onToggleFavorite: () => void;
  onOpenDetail: () => void;
  onUse: () => void;
  using: boolean;
}) {
  const t = useTranslations("templates");

  return (
    <m.li
      layout
      variants={listItem}
      initial="hidden"
      animate="show"
      exit="exit"
      {...liftHover}
      className="group relative"
    >
      <button
        type="button"
        onClick={onOpenDetail}
        className="block w-full overflow-hidden rounded-2xl border bg-surface-2 surface-highlight focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        style={{ aspectRatio: `${template.width} / ${template.height}` }}
      >
        {/* biome-ignore lint/performance/noImgElement: generated SVG data: URL, not optimizable by next/image */}
        <img
          src={template.previewDataUrl}
          alt={template.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </button>

      {template.premium && (
        <div className="absolute top-2 left-2">
          <PremiumInfoDialog trigger={<Badge variant="premium">{t("premiumBadge")}</Badge>} />
        </div>
      )}

      <Button
        size="icon-sm"
        variant="glass"
        aria-label={favorited ? t("unfavorite") : t("favorite")}
        aria-pressed={favorited}
        onClick={onToggleFavorite}
        className="absolute top-2 right-2 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <HeartIcon className={favorited ? "fill-current text-destructive" : ""} />
      </Button>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 rounded-b-2xl bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-white">{template.title}</span>
        <Button size="sm" loading={using} onClick={onUse}>
          {t("useTemplate")}
        </Button>
      </div>
    </m.li>
  );
}
