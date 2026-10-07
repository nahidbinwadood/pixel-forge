import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "About",
  description: "Why we're building PixelForge, and what's live today.",
  openGraph: { title: "About · PixelForge", description: "Why we're building PixelForge, and what's live today." },
};

const KEYS = ["p1", "p2", "p3"] as const;

export default async function AboutPage() {
  const t = await getTranslations("site.about");
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <h1 className="text-display">{t("title")}</h1>
        <p className="mt-4 text-lg text-text-2">{t("lead")}</p>
      </Reveal>
      <div className="mt-8 grid gap-5">
        {KEYS.map((k, i) => (
          <Reveal key={k} delay={Math.min(i * 0.05, 0.15)}>
            <p className="text-pretty text-text-2">{t(`paragraphs.${k}`)}</p>
          </Reveal>
        ))}
      </div>
    </article>
  );
}
