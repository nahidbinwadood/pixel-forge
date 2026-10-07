import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { TemplateSummary } from "@/lib/templates";

/** Home's "Pick a template" CTA (A3 brief): a few real previews, linking to the full browser. */
export async function HomeTemplateTeaser({ templates }: { templates: TemplateSummary[] }) {
  const t = await getTranslations("templates.home");
  if (templates.length === 0) return null;

  return (
    <Link
      href="/templates"
      className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border bg-surface-2 p-5 surface-highlight transition-colors hover:border-primary/40"
    >
      <div className="flex shrink-0 -space-x-6">
        {templates.slice(0, 3).map((tpl, i) => (
          // biome-ignore lint/performance/noImgElement: generated SVG data: URL, not optimizable by next/image
          <img
            key={tpl.id}
            src={tpl.previewDataUrl}
            alt=""
            className="size-16 rounded-xl border-2 border-surface-2 object-cover shadow-float"
            style={{ zIndex: 3 - i, aspectRatio: `${tpl.width} / ${tpl.height}` }}
          />
        ))}
      </div>
      <span className="grid flex-1 gap-0.5">
        <span className="font-display text-lg font-semibold">{t("pickTemplate")}</span>
        <span className="text-sm text-text-2">{t("pickTemplateDesc")}</span>
      </span>
      <ArrowUpRightIcon
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}
