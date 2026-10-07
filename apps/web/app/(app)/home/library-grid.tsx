"use client";

import { ImageOffIcon } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fadeUp, liftHover, stagger } from "@/lib/motion";
import type { LibraryItem } from "./library";

const MLink = m.create(Link);

/** Staggered thumbnail grid. Re-fetches the server data while anything is still processing. */
export function LibraryGrid({ items, processingLabel }: { items: LibraryItem[]; processingLabel: string }) {
  const router = useRouter();
  const processing = items.some((i) => i.processing);
  useEffect(() => {
    if (!processing) return;
    const id = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(id);
  }, [processing, router]);

  return (
    <m.ul
      initial="hidden"
      animate="show"
      variants={stagger(0.05)}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      {items.map((item) => (
        <m.li key={item.id} variants={fadeUp}>
          <MLink
            href="/uploads"
            {...liftHover}
            className="group block aspect-square overflow-hidden rounded-2xl border bg-surface-2 surface-highlight"
          >
            {item.processing ? (
              <span className="flex size-full items-center justify-center gap-2 shimmer text-xs text-text-2">
                <span className="size-2 animate-pulse rounded-full bg-aurora" aria-hidden />
                {processingLabel}
              </span>
            ) : item.thumbUrl ? (
              // biome-ignore lint/performance/noImgElement: presigned URLs, not optimizable by next/image
              <img
                src={item.thumbUrl}
                alt={item.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <ImageOffIcon className="size-5 text-muted-foreground" aria-hidden />
                <span className="sr-only">{item.name}</span>
              </span>
            )}
          </MLink>
        </m.li>
      ))}
    </m.ul>
  );
}
