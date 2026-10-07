import { cn } from "cn";
import { SparklesIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { SectionHeading, SectionStatus } from "./section-heading";
import { SectionItem, SectionLiftCard, SectionStagger } from "./section-motion";

const ZOOM = "transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]";

/** Asymmetric tool grid. Every tile shows the tool on a real photo; unbuilt tools are marked honestly. */
export async function ToolBento() {
  const t = await getTranslations("sections");

  return (
    <section
      id="tools"
      aria-labelledby="tools-title"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:py-32"
    >
      <SectionHeading id="tools-title" label={t("tools.label")} title={t("tools.title")} body={t("tools.body")} />

      <SectionStagger className="mt-14 grid gap-4 md:grid-cols-6 md:grid-rows-[auto_auto_auto] lg:gap-5">
        <Tile
          className="md:col-span-4 md:row-span-2"
          name={t("tools.editor.name")}
          benefit={t("tools.editor.benefit")}
          status={t("soon")}
          visualClass="aspect-[4/3] md:aspect-auto md:min-h-[26rem]"
        >
          <Image
            src="/hero/lake-vivid.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className={cn("object-cover", ZOOM)}
          />
          <div className="absolute end-4 bottom-4 w-56 rounded-2xl glass p-4 shadow-float sm:end-6 sm:bottom-6 sm:w-64">
            {(
              [
                ["brightness", 62],
                ["contrast", 48],
                ["saturation", 74],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="grid gap-1.5 py-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-2">{t(`tools.sliders.${key}`)}</span>
                  <span className="font-mono tabular-nums">{value - 50 > 0 ? `+${value - 50}` : value - 50}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-aurora" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Tile>

        <Tile
          className="md:col-span-2"
          name={t("tools.bg.name")}
          benefit={t("tools.bg.benefit")}
          status={t("soon")}
          note={t("illustration")}
          visualClass="aspect-[4/3]"
        >
          <Image
            src="/hero/vase-original.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 30vw, 100vw"
            // Vase sits mid-frame on white: contain (on the photo's own white) keeps the whole subject visible.
            className={cn("bg-white object-contain", ZOOM)}
          />
          {/* Checkerboard = "transparent" background, revealed on a diagonal */}
          <div
            aria-hidden
            className="absolute inset-0 [mask-image:linear-gradient(115deg,transparent_48%,black_48.5%)] bg-[length:20px_20px] bg-[conic-gradient(#e9e9f1_90deg,#fff_90deg_180deg,#e9e9f1_180deg_270deg,#fff_270deg)] opacity-95"
          />
          <div aria-hidden className="absolute inset-y-0 start-[53%] w-px rotate-[25deg] bg-aurora shadow-glow" />
        </Tile>

        <Tile
          className="md:col-span-2"
          name={t("tools.ai.name")}
          benefit={t("tools.ai.benefit")}
          status={t("soon")}
          visualClass="aspect-[4/3] bg-mesh bg-surface-3"
        >
          <div className="absolute inset-0 flex flex-col justify-center gap-3 p-5">
            <div className="flex items-center gap-2 rounded-full glass px-3.5 py-2.5 text-sm shadow-float">
              <SparklesIcon className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate font-mono text-xs">{t("tools.ai.prompt")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-surface-1/70 shimmer" />
              ))}
            </div>
          </div>
        </Tile>

        <Tile
          className="md:col-span-3"
          name={t("tools.templates.name")}
          benefit={t("tools.templates.benefit")}
          status={t("soon")}
          visualClass="aspect-[16/10] bg-surface-3/60"
        >
          <div className="absolute inset-0 flex items-end justify-center gap-0 pb-0">
            {(
              [
                ["/hero/street-vivid.webp", "-rotate-[8deg] translate-x-8 translate-y-6 group-hover:-rotate-[12deg]"],
                ["/hero/latte-film.webp", "z-10 translate-y-2 group-hover:-translate-y-2"],
                ["/hero/beach-vivid.webp", "rotate-[8deg] -translate-x-8 translate-y-6 group-hover:rotate-[12deg]"],
              ] as const
            ).map(([src, cls]) => (
              <div
                key={src}
                className={cn(
                  "relative aspect-[4/5] w-[30%] max-w-40 overflow-hidden rounded-xl border-4 border-surface-1 shadow-float transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                  cls,
                )}
              >
                <Image src={src} alt="" fill sizes="160px" className="object-cover" />
              </div>
            ))}
          </div>
        </Tile>

        <Tile
          className="md:col-span-3"
          name={t("tools.collage.name")}
          benefit={t("tools.collage.benefit")}
          status={t("soon")}
          visualClass="aspect-[16/10]"
        >
          <div className="absolute inset-0 grid grid-cols-[3fr_2fr] grid-rows-2 gap-1.5 p-1.5">
            {(
              [
                ["/hero/vase-mono.webp", "row-span-2"],
                ["/hero/latte-vivid.webp", ""],
                ["/hero/street-film.webp", ""],
              ] as const
            ).map(([src, cls]) => (
              <div key={src} className={cn("relative overflow-hidden rounded-lg", cls)}>
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 60vw"
                  className={cn("object-cover", ZOOM)}
                />
              </div>
            ))}
          </div>
        </Tile>
      </SectionStagger>
    </section>
  );
}

function Tile({
  name,
  benefit,
  status,
  note,
  className,
  visualClass,
  children,
}: {
  name: string;
  benefit: string;
  status: string;
  note?: string;
  className?: string;
  visualClass?: string;
  children: ReactNode;
}) {
  return (
    <SectionItem className={cn("flex", className)}>
      <SectionLiftCard className="group flex w-full flex-col overflow-hidden rounded-3xl border bg-card surface-highlight">
        <div className={cn("relative flex-1 overflow-hidden", visualClass)}>
          {children}
          <div className="absolute start-4 top-4 flex gap-2">
            <SectionStatus>{status}</SectionStatus>
            {note && <SectionStatus>{note}</SectionStatus>}
          </div>
        </div>
        <div className="grid gap-1 border-t px-5 py-4 sm:px-6">
          <h3 className="text-xl">{name}</h3>
          <p className="text-sm text-text-2">{benefit}</p>
        </div>
      </SectionLiftCard>
    </SectionItem>
  );
}
