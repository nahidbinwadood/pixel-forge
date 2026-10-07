import { DownloadIcon, LockKeyholeIcon, MapPinOffIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, SectionStatus } from "./section-heading";
import { SectionItem, SectionStagger } from "./section-motion";

const CARDS = [
  { key: "private", icon: LockKeyholeIcon },
  { key: "exif", icon: MapPinOffIcon },
  { key: "delete", icon: Trash2Icon },
  { key: "export", icon: DownloadIcon },
] as const;

/** Real Phase-1 privacy guarantees (all shipped), not promises. */
export async function Privacy() {
  const t = await getTranslations("sections");

  return (
    <section aria-labelledby="privacy-title" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="grid content-start gap-10">
          <SectionHeading
            id="privacy-title"
            label={t("privacy.label")}
            title={t("privacy.title")}
            body={t("privacy.body")}
          />
          <div
            aria-hidden
            className="relative grid size-40 place-items-center rounded-[2rem] border bg-card surface-highlight"
          >
            <div className="absolute inset-4 rounded-3xl bg-aurora opacity-20 blur-2xl" />
            <ShieldCheckIcon className="relative size-16 text-primary" strokeWidth={1.25} />
          </div>
        </div>

        <SectionStagger className="grid gap-4 sm:grid-cols-2">
          {CARDS.map(({ key, icon: Icon }) => (
            <SectionItem
              key={key}
              className={
                key === "exif"
                  ? "grid content-start gap-4 rounded-3xl border bg-card p-6 surface-highlight sm:row-span-2"
                  : "grid content-start gap-4 rounded-3xl border bg-card p-6 surface-highlight"
              }
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <SectionStatus live>{t("today")}</SectionStatus>
              </div>
              <h3 className="text-xl">{t(`privacy.${key}.title`)}</h3>
              <p className="text-text-2">{t(`privacy.${key}.body`)}</p>
              {key === "exif" && (
                <ExifDiagram
                  before={t("privacy.before")}
                  after={t("privacy.after")}
                  gps={t("privacy.gps")}
                  camera={t("privacy.camera")}
                  removed={t("privacy.removed")}
                />
              )}
            </SectionItem>
          ))}
        </SectionStagger>
      </div>
    </section>
  );
}

function ExifDiagram(l: { before: string; after: string; gps: string; camera: string; removed: string }) {
  return (
    <div className="mt-2 grid gap-3 rounded-2xl border bg-surface-1 p-4 font-mono text-xs" aria-hidden>
      <div className="grid gap-1.5">
        <span className="text-muted-foreground">{l.before}</span>
        <span className="w-fit rounded-md bg-warning/15 px-2 py-1 text-warning">{l.gps}</span>
        <span className="w-fit rounded-md bg-warning/15 px-2 py-1 text-warning">{l.camera}</span>
      </div>
      <div className="h-px bg-border" />
      <div className="grid gap-1.5">
        <span className="text-muted-foreground">{l.after}</span>
        <span className="w-fit rounded-md bg-success/12 px-2 py-1 text-success line-through decoration-success/60">
          {l.gps}
        </span>
        <span className="w-fit rounded-md bg-success/12 px-2 py-1 text-success">
          {l.camera} · {l.removed}
        </span>
      </div>
    </div>
  );
}
