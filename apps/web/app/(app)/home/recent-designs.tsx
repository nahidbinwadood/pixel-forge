import { cn } from "cn";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ProjectCard } from "@/lib/projects";
import { NewDesignDialog } from "../projects/new-design-dialog";

/** "Start from scratch" + the most recent designs (replaces the pre-editor teaser). */
export async function RecentDesigns({
  designs,
  userId,
  className,
}: {
  designs: ProjectCard[];
  userId: string;
  className?: string;
}) {
  const t = await getTranslations("editor");
  return (
    <section
      aria-labelledby="recent-designs"
      className={cn("flex flex-col gap-5 rounded-3xl border bg-surface-1 p-5 surface-highlight md:p-6", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recent-designs" className="text-h2">
          {t("home.title")}
        </h2>
        {designs.length > 0 && (
          <Link href="/projects" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t("home.viewAll")} <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <li>
          <NewDesignDialog
            userId={userId}
            trigger={
              <button
                type="button"
                data-testid="start-from-scratch"
                className="grid aspect-[4/3] w-full place-items-center content-center gap-2 rounded-2xl border border-dashed bg-surface-2 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-surface-3 focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none"
              >
                <span className="grid size-10 place-items-center rounded-full bg-primary-solid text-white">
                  <PlusIcon className="size-5" aria-hidden />
                </span>
                {t("home.scratch")}
              </button>
            }
          />
        </li>
        {designs.slice(0, 5).map((d) => (
          <li key={d.id}>
            <Link
              href={`/editor/${d.id}`}
              className="grid gap-1.5 rounded-2xl focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              <span className="grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border bg-surface-3 p-2">
                {d.thumbUrl ? (
                  // biome-ignore lint/performance/noImgElement: presigned URL (CLAUDE.md: next/image except presigned)
                  <img
                    src={d.thumbUrl}
                    alt=""
                    className="max-h-full max-w-full rounded-sm object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {d.width}×{d.height}
                  </span>
                )}
              </span>
              <span className="truncate px-1 text-sm font-medium">{d.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      {designs.length === 0 && <p className="text-sm text-text-2">{t("home.empty")}</p>}
    </section>
  );
}
