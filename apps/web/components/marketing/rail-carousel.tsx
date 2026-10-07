"use client";

import { cn } from "cn";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { duration, ease, spring } from "@/lib/motion";

const PHOTOS = ["latte", "street", "vase", "lake"] as const;
const PRESETS = ["original", "vivid", "film", "mono"] as const;

/**
 * Picsart-style rail of 4:5 cards: one photo, four looks. Tabs pick the photo (cards crossfade),
 * prev/next buttons and scroll-snap move the rail. Arrow keys on the tablist switch photos.
 */
export function RailCarousel() {
  const t = useTranslations("landing.looks");
  const photos = PHOTOS.map((id) => ({ id, label: t(`photos.${id}`) }));
  const presets = PRESETS.map((id) => ({ id, label: t(`presets.${id}`), description: t(`presetDesc.${id}`) }));
  const [photoId, setPhotoId] = useState<string>(PHOTOS[0]);
  const photo = photos.find((p) => p.id === photoId) ?? photos[0];
  const scroller = useRef<HTMLUListElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: photoId is a trigger (new rail mounts → reset scroll + edges)
  useEffect(() => {
    updateEdges();
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateEdges, photoId]);

  const page = (dir: 1 | -1) => {
    const el = scroller.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 16) * 2, behavior: "smooth" });
  };

  const onTabKey = (e: KeyboardEvent, index: number) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const next = (index + delta + photos.length) % photos.length;
    const target = photos[next];
    if (!target) return;
    setPhotoId(target.id);
    tabRefs.current[next]?.focus();
  };

  if (!photo) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label={t("tabsLabel")}
          className="flex gap-1 rounded-full border bg-surface-1 p-1 shadow-card"
        >
          {photos.map((p, i) => {
            const active = p.id === photo.id;
            return (
              <button
                key={p.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`looks-tab-${p.id}`}
                aria-selected={active}
                aria-controls="looks-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => setPhotoId(p.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  "relative isolate rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active ? "text-background" : "text-text-2 hover:text-foreground",
                )}
              >
                {active && (
                  <m.span
                    layoutId="looks-tab"
                    className="absolute inset-0 -z-10 rounded-full bg-foreground"
                    transition={spring.ui}
                  />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => page(-1)} disabled={edges.start} aria-label={t("prev")}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon" onClick={() => page(1)} disabled={edges.end} aria-label={t("next")}>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div id="looks-panel" role="tabpanel" aria-labelledby={`looks-tab-${photo.id}`} className="-mx-4 sm:-mx-6">
        <AnimatePresence mode="wait" initial={false}>
          <m.ul
            key={photo.id}
            ref={scroller}
            onScroll={updateEdges}
            aria-label={t("rail", { photo: photo.label })}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: duration.panel, ease: ease.out }}
            className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
          >
            {presets.map((preset, i) => (
              <m.li
                key={preset.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.ui, delay: i * 0.05 }}
                className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[23rem]"
              >
                <m.figure
                  whileHover={{ y: -6 }}
                  transition={spring.ui}
                  className="group relative aspect-[4/5] overflow-hidden rounded-3xl border bg-surface-2 shadow-card"
                >
                  <Image
                    src={`/hero/${photo.id}-${preset.id}.webp`}
                    alt={t("alt", { photo: photo.label, preset: preset.label })}
                    fill
                    sizes="(min-width: 1024px) 368px, (min-width: 640px) 46vw, 78vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <span className="absolute top-3.5 left-3.5 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                    {preset.label}
                  </span>
                  <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/25 to-transparent px-5 pt-16 pb-5 text-white">
                    <span className="block font-display text-xl font-bold tracking-tight">{preset.label}</span>
                    <span className="block text-sm text-white/80">{preset.description}</span>
                  </figcaption>
                </m.figure>
              </m.li>
            ))}
            <li className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[23rem]">
              <div className="flex aspect-[4/5] flex-col justify-end gap-3 rounded-3xl border border-dashed bg-surface-1 p-6">
                <span className="font-display text-2xl font-bold tracking-tight">{t("ctaTitle")}</span>
                <span className="text-sm text-text-2">{t("ctaBody")}</span>
                <Button asChild className="mt-2 self-start">
                  <Link href="/sign-up">
                    {t("ctaButton")}
                    <ArrowRightIcon aria-hidden />
                  </Link>
                </Button>
              </div>
            </li>
          </m.ul>
        </AnimatePresence>
      </div>
    </div>
  );
}
