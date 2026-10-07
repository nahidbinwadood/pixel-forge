import { CheckIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CropFrame } from "./hero-crop-frame";
import { HeroDropCard } from "./hero-drop-card";
import { HeroFloatingCards } from "./hero-floating-cards";
import { HeroIntro, HeroItem } from "./hero-intro";

/**
 * Landing hero (v2): centered, airy, one signature motif. The keyword sits inside the editor's crop frame,
 * the drop card is the single primary action, and two real edited "prints" float at the edges (xl+).
 */
export async function Hero() {
  const t = await getTranslations("landing.hero");
  const checks = [t("checks.card"), t("checks.private"), t("checks.browser")];

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <HeroBackdrop />
      <HeroFloatingCards
        cards={[
          { src: "/hero/latte-film.webp", alt: t("floatLeftAlt"), chip: t("chipFilm"), side: "left" },
          { src: "/hero/vase-vivid.webp", alt: t("floatRightAlt"), chip: t("chipVivid"), side: "right" },
        ]}
      />

      <HeroIntro className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 pb-20 text-center sm:px-6 sm:pt-20 lg:pb-28">
        <HeroItem>
          <p className="inline-flex items-center gap-2 rounded-full border bg-surface-1/80 px-3.5 py-1.5 font-mono text-[11px] text-text-2 shadow-card backdrop-blur sm:text-xs">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
              <span className="relative size-2 rounded-full bg-success" />
            </span>
            {t("eyebrow")}
          </p>
        </HeroItem>

        <HeroItem>
          <h1 id="hero-title" className="mt-7 text-hero font-extrabold">
            <span className="block">{t("titleLead")}</span>
            <span className="block">
              <CropFrame tag={t("cropTag")}>{t("titleKeyword")}</CropFrame> {t("titleTail")}
            </span>
          </h1>
        </HeroItem>

        <HeroItem>
          <p className="mt-10 max-w-xl text-pretty text-base text-text-2 sm:mt-11 sm:text-lg">{t("subtitle")}</p>
        </HeroItem>

        <HeroItem className="mt-9 flex w-full justify-center">
          <HeroDropCard />
        </HeroItem>

        <HeroItem>
          <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2.5 text-sm text-text-2">
            {checks.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-success/12 text-success" aria-hidden>
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </HeroItem>
      </HeroIntro>
    </section>
  );
}

/** Soft violet/blue glows over a very faint grid that fades out toward the edges. Pure CSS. */
function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]" />
      <div className="absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--aurora-1)_22%,transparent),transparent)] blur-2xl" />
      <div className="absolute top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--aurora-2)_16%,transparent),transparent)] blur-2xl" />
      <div className="absolute top-56 -right-40 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--aurora-3)_12%,transparent),transparent)] blur-2xl" />
    </div>
  );
}
