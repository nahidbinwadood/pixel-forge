import { cn } from "cn";
import { getTranslations } from "next-intl/server";
import { LightSweep } from "@/components/brand/light-sweep";
import { Badge } from "@/components/ui/badge";

const PRESETS = [
  { id: "vivid", label: "Vivid", src: "/hero/lake-vivid.webp" },
  { id: "film", label: "Film", src: "/hero/lake-film.webp" },
  { id: "mono", label: "Mono", src: "/hero/lake-mono.webp" },
] as const;

/** Honest teaser: the editor isn't here yet, but the light sweep shows the kind of edit it makes. */
export async function EditorTeaser({ className }: { className?: string }) {
  const t = await getTranslations("home");
  return (
    <section
      aria-labelledby="editor-teaser"
      className={cn("flex flex-col gap-5 rounded-3xl border bg-surface-1 p-5 surface-highlight md:p-6", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid max-w-md gap-1.5">
          <h2 id="editor-teaser" className="text-h2">
            {t("nextTitle")}
          </h2>
          <p className="text-sm text-text-2">{t("nextBody")}</p>
        </div>
        <Badge variant="outline">{t("nextBadge")}</Badge>
      </div>
      <LightSweep
        original="/hero/lake-original.webp"
        presets={PRESETS}
        alt="Alpine lake under storm clouds"
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
    </section>
  );
}
