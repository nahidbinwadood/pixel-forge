"use client";

import { type HTMLMotionProps, m } from "motion/react";
import { fadeUp, stagger } from "@/lib/motion";

/** One orchestrated hero entrance: children with <HeroItem> rise in sequence. */
export function HeroIntro(props: HTMLMotionProps<"div">) {
  return <m.div initial="hidden" animate="show" variants={stagger(0.09, 0.05)} {...props} />;
}

export function HeroItem(props: HTMLMotionProps<"div">) {
  return <m.div variants={fadeUp} {...props} />;
}
