"use client";

import { cn } from "cn";
import { type MotionValue, m, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect } from "react";
import { spring } from "@/lib/motion";

interface FloatCard {
  src: string;
  alt: string;
  chip: string;
  side: "left" | "right";
}

/**
 * Two tilted photo "prints" at the hero edges (xl+, so they never collide with the headline). They drift against the cursor (parallax) and lift on hover.
 * Static under reduced motion. Real edits: the chip names the preset that produced the image.
 */
export function HeroFloatingCards({ cards }: { cards: readonly FloatCard[] }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduce]);

  return (
    <div className="pointer-events-none absolute inset-0 hidden min-[1400px]:block">
      {cards.map((card, i) => (
        <FloatingCard key={card.src} card={card} index={i} sx={sx} sy={sy} />
      ))}
    </div>
  );
}

function FloatingCard({
  card,
  index,
  sx,
  sy,
}: {
  card: FloatCard;
  index: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}) {
  const left = card.side === "left";
  const depth = left ? -26 : 22;
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);

  return (
    <m.div
      className={cn(
        "pointer-events-auto absolute w-44 min-[1800px]:w-56",
        left ? "top-[18%] left-[2%] min-[1800px]:left-[6%]" : "top-[40%] right-[2%] min-[1800px]:right-[6%]",
      )}
      style={{ x, y }}
    >
      <m.div
        initial={{ opacity: 0, y: 40, rotate: left ? -14 : 14 }}
        animate={{ opacity: 1, y: 0, rotate: left ? -7 : 6 }}
        transition={{ ...spring.soft, delay: 0.5 + index * 0.12 }}
      >
        <m.figure
          whileHover={{ y: -10, rotate: left ? -3 : 3, scale: 1.04 }}
          transition={spring.ui}
          className="relative rounded-2xl border bg-surface-1 p-2 shadow-float"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
            <Image
              src={card.src}
              alt={card.alt}
              fill
              priority
              sizes="(min-width: 1536px) 224px, 192px"
              className="object-cover"
            />
          </div>
          <figcaption className="absolute top-4 left-4 rounded-full glass px-2.5 py-1 text-xs font-semibold">
            {card.chip}
          </figcaption>
        </m.figure>
      </m.div>
    </m.div>
  );
}
