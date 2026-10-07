import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "./section-heading";
import { SectionItem, SectionStagger } from "./section-motion";

const FORMATS = [
  { key: "square", size: "1080 × 1080", ratio: "aspect-square", w: "w-44 sm:w-52" },
  { key: "portrait", size: "1080 × 1350", ratio: "aspect-[4/5]", w: "w-44 sm:w-52" },
  { key: "story", size: "1080 × 1920", ratio: "aspect-[9/16]", w: "w-36 sm:w-40" },
  { key: "youtube", size: "1280 × 720", ratio: "aspect-video", w: "w-64 sm:w-80" },
  { key: "pin", size: "1000 × 1500", ratio: "aspect-[2/3]", w: "w-40 sm:w-44" },
] as const;

/** Full-bleed dark contrast band, always dark regardless of theme (the `dark` class switches the tokens). */
export async function FormatsBand() {
  const t = await getTranslations("sections");

  return (
    <section
      aria-labelledby="formats-title"
      className="dark relative isolate overflow-hidden bg-background py-24 text-foreground lg:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.45),rgb(45_168_255/0.18)_55%,transparent)] blur-2xl"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          id="formats-title"
          align="center"
          label={t("formats.label")}
          title={t("formats.title")}
          body={t("formats.body")}
        />
        <p className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-surface-2/70 px-3.5 py-1.5 text-xs font-medium text-text-2">
            <span aria-hidden className="size-1.5 rounded-full bg-aurora-3" />
            {t("formats.badge")}
          </span>
        </p>
      </div>

      <SectionStagger
        step={0.07}
        className="mt-16 flex snap-x snap-mandatory items-end gap-5 overflow-x-auto px-4 pb-4 sm:px-6 lg:justify-center lg:gap-7"
        role="list"
        aria-label={t("formats.title")}
      >
        {FORMATS.map((f, i) => (
          <SectionItem key={f.key} role="listitem" className={`shrink-0 snap-center ${f.w}`}>
            <figure className="grid gap-3">
              <div className={`relative ${f.ratio} overflow-hidden rounded-2xl border border-white/10 shadow-float`}>
                <Image
                  src={i % 2 ? "/hero/street-film.webp" : "/hero/street-vivid.webp"}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
              <figcaption className="grid gap-0.5">
                <span className="text-sm font-medium">{t(`formats.${f.key}`)}</span>
                <span className="font-mono text-xs text-muted-foreground">{f.size}</span>
              </figcaption>
            </figure>
          </SectionItem>
        ))}
      </SectionStagger>
    </section>
  );
}
