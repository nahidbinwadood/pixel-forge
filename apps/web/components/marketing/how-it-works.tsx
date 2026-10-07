import { DownloadIcon, SlidersHorizontalIcon, UploadIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionAppMock } from "./section-app-mock";
import { SectionHeading, SectionStatus } from "./section-heading";
import { SectionItem, SectionStagger } from "./section-motion";

const STEPS = [
  { key: "upload", icon: UploadIcon, live: true },
  { key: "adjust", icon: SlidersHorizontalIcon, live: false },
  { key: "export", icon: DownloadIcon, live: false },
] as const;

/** One huge rounded panel: copy + app-window mock on top, three numbered steps below. */
export async function HowItWorks() {
  const t = await getTranslations("sections");

  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6">
      <div className="relative overflow-hidden rounded-[2.5rem] border bg-card px-6 py-14 surface-highlight sm:px-10 lg:px-16 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-40 -top-40 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.16),rgb(255_179_92/0.08)_60%,transparent)]"
        />

        <div className="relative grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
          <SectionHeading id="how-title" label={t("how.label")} title={t("how.title")} body={t("how.body")} />
          <SectionAppMock
            file={t("how.file")}
            panel={t("how.panel")}
            exported={t("how.exported")}
            sliders={[
              { label: t("how.sliders.exposure"), value: 18 },
              { label: t("how.sliders.contrast"), value: 26 },
              { label: t("how.sliders.vibrance"), value: 41 },
            ]}
          />
        </div>

        <SectionStagger className="relative mt-20 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map(({ key, icon: Icon, live }, i) => (
            <SectionItem key={key} className="grid content-start gap-4 border-t pt-6">
              <div className="-mt-[25px] h-0.5 w-8 bg-primary" aria-hidden />
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-primary">{String(i + 1).padStart(2, "0")}</span>
                <SectionStatus live={live}>{live ? t("today") : t("soon")}</SectionStatus>
              </div>
              <span className="grid size-11 place-items-center rounded-xl border bg-surface-1 text-foreground shadow-card">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-xl">{t(`how.steps.${key}.title`)}</h3>
              <p className="text-text-2">{t(`how.steps.${key}.body`)}</p>
            </SectionItem>
          ))}
        </SectionStagger>
      </div>
    </section>
  );
}
