"use client";

import type { AITool } from "@pixelforge/shared";
import { cn } from "cn";
import { CornerUpLeftIcon, HistoryIcon, StarIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listItem } from "@/lib/motion";
import type { HistoryItem } from "./types";

const STATUS_DOT: Record<string, string> = {
  succeeded: "bg-success",
  failed: "bg-destructive",
  blocked: "bg-destructive",
  queued: "bg-warning",
  running: "bg-warning",
};

/**
 * Right-rail prompt history for one tool: favorite toggle, favorites filter, reuse, load more.
 * `refreshKey` changes when a job finishes so the newest run appears.
 */
export function HistoryRail({
  tool,
  initial,
  initialCursor,
  refreshKey,
  onReuse,
}: {
  /** Omit for all tools (hub). */
  tool?: AITool;
  initial: HistoryItem[];
  initialCursor: string | null;
  refreshKey: number;
  onReuse?: (jobId: string) => void;
}) {
  const t = useTranslations("ai.history");
  const ts = useTranslations("ai.status");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [favOnly, setFavOnly] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (after: string | null, favorites: boolean) => {
      const qs = new URLSearchParams({ limit: "12" });
      if (tool) qs.set("tool", tool);
      if (after) qs.set("cursor", after);
      if (favorites) qs.set("favorites", "1");
      try {
        const res = await fetch(`/api/v1/ai/prompts?${qs}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { items: HistoryItem[]; nextCursor: string | null };
        setItems((prev) => (after ? [...prev, ...data.items] : data.items));
        setCursor(data.nextCursor);
        setError(false);
      } catch {
        setError(true);
      }
    },
    [tool],
  );

  useEffect(() => {
    if (refreshKey > 0) void load(null, favOnly);
  }, [refreshKey, load, favOnly]);

  const toggleFav = async (item: HistoryItem) => {
    const next = !item.favorite;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, favorite: next } : i)));
    const res = await fetch(`/api/v1/ai/prompts/${item.id}/favorite`, { method: next ? "PUT" : "DELETE" }).catch(
      () => null,
    );
    if (!res?.ok) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, favorite: !next } : i)));
  };

  const switchFilter = (favorites: boolean) => {
    setFavOnly(favorites);
    void load(null, favorites);
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <HistoryIcon className="size-4 text-muted-foreground" aria-hidden />
          {t("title")}
        </h2>
        <Button variant="ghost" size="sm" aria-pressed={favOnly} onClick={() => switchFilter(!favOnly)}>
          <StarIcon className={cn(favOnly && "fill-current text-warning")} aria-hidden />
          {favOnly ? t("all") : t("favorites")}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{t("loadError")}</p>}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid gap-2">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <m.li
                key={item.id}
                layout
                variants={listItem}
                initial="hidden"
                animate="show"
                exit="exit"
                className="group flex items-start gap-3 rounded-xl border bg-surface-1 p-2.5"
              >
                {item.thumbUrl ? (
                  // biome-ignore lint/performance/noImgElement: presigned URLs, not optimizable by next/image
                  <img src={item.thumbUrl} alt="" className="size-11 shrink-0 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <span className="size-11 shrink-0 rounded-lg bg-surface-3" aria-hidden />
                )}
                <div className="grid min-w-0 flex-1 gap-1">
                  <p className="line-clamp-2 font-mono text-xs leading-snug">{item.summary}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("size-1.5 rounded-full", STATUS_DOT[item.status])} aria-hidden />
                    {ts(item.status)} · {format.relativeTime(new Date(item.createdAt), now)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={item.favorite ? t("unfavorite") : t("favorite")}
                    aria-pressed={item.favorite}
                    onClick={() => void toggleFav(item)}
                  >
                    <StarIcon className={cn(item.favorite && "fill-current text-warning")} aria-hidden />
                  </Button>
                  {onReuse && (
                    <Button variant="ghost" size="icon-sm" aria-label={t("reuse")} onClick={() => onReuse(item.id)}>
                      <CornerUpLeftIcon aria-hidden />
                    </Button>
                  )}
                </div>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {cursor && (
        <Button variant="ghost" size="sm" onClick={() => void load(cursor, favOnly)}>
          {t("loadMore")}
        </Button>
      )}
    </div>
  );
}
