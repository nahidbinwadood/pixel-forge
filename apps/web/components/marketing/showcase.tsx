import { getTranslations } from "next-intl/server";
import { LightSweep } from "@/components/brand/light-sweep";
import { Reveal } from "@/components/motion/reveal";

const PRESETS = [
  { id: "film", label: "Film", src: "/hero/beach-film.webp" },
  { id: "vivid", label: "Vivid", src: "/hero/beach-vivid.webp" },
  { id: "mono", label: "Mono", src: "/hero/beach-mono.webp" },
] as const;

/** Second, quieter before/after: text on the left, comparison on the right, reversed from the hero. */
export async function Showcase() {
  const t = await getTranslations("landing.showcase");
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12">
      <Reveal className="lg:order-2 lg:col-span-7">
        <LightSweep
          original="/hero/beach-original.webp"
          presets={PRESETS}
          alt={t("alt")}
          sizes="(min-width: 1024px) 55vw, 100vw"
        />
      </Reveal>
      <Reveal className="grid gap-4 lg:order-1 lg:col-span-5" delay={0.1}>
        <h2 className="text-h1">{t("title")}</h2>
        <p className="max-w-md text-lg text-text-2">{t("subtitle")}</p>
      </Reveal>
    </section>
  );
}
