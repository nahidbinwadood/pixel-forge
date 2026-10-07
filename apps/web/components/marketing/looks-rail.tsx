import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { RailCarousel } from "./rail-carousel";

/** "One photo. Every mood." A Picsart-style rail of real preset edits, grouped by photo. */
export async function LooksRail() {
  const t = await getTranslations("landing.looks");
  return (
    <section id="looks" aria-labelledby="looks-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6">
        <Reveal className="flex flex-col items-start gap-4">
          <p className="inline-flex items-center gap-2 rounded-full border bg-surface-1 px-3 py-1 font-mono text-xs text-text-2">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {t("eyebrow")}
          </p>
          <h2 id="looks-title" className="text-display">
            {t("title")}
          </h2>
          <p className="max-w-xl text-pretty text-text-2 sm:text-lg">{t("subtitle")}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <RailCarousel />
        </Reveal>
        <p className="font-mono text-xs text-muted-foreground">{t("caption")}</p>
      </div>
    </section>
  );
}
