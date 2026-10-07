import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LightSweep } from "@/components/brand/light-sweep";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

const POINTS = ["light", "contrast", "color", "filters"] as const;

/** Two-column "try it" section: what you can adjust, next to the live before/after in a minimal app window. */
export async function SweepFeature() {
  const t = await getTranslations("landing.sweep");
  return (
    <section aria-labelledby="sweep-title" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16">
        <Reveal className="flex flex-col gap-6 lg:col-span-5">
          <p className="flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-primary uppercase">
            <span className="h-px w-8 bg-primary" aria-hidden />
            {t("eyebrow")}
          </p>
          <h2 id="sweep-title" className="text-display">
            {t("title")}
          </h2>
          <p className="text-pretty text-text-2 sm:text-lg">{t("body")}</p>
          <ul className="grid gap-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"
                  aria-hidden
                >
                  <CheckIcon className="size-3.5" strokeWidth={3} />
                </span>
                <span>{t(`points.${p}`)}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-2 self-start">
            <Link href="/sign-up">
              {t("cta")}
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="rounded-[1.75rem] border bg-surface-1 shadow-float">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <span className="flex gap-1.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/15" />
              </span>
              <span className="truncate rounded-full bg-secondary px-3 py-1 font-mono text-xs text-text-2">
                {t("file")}
              </span>
            </div>
            <div className="p-3 sm:p-4">
              <LightSweep
                original="/hero/lake-original.webp"
                presets={[
                  { id: "vivid", label: "Vivid", src: "/hero/lake-vivid.webp" },
                  { id: "film", label: "Film", src: "/hero/lake-film.webp" },
                  { id: "mono", label: "Mono", src: "/hero/lake-mono.webp" },
                ]}
                alt={t("alt")}
                sizes="(min-width: 1024px) 56vw, 100vw"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
