"use client";

import { type HTMLMotionProps, m } from "motion/react";
import { duration, ease, stagger } from "@/lib/motion";

/** Fades/slides content in once when scrolled into view. For page sections, not every element. */
export function Reveal({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: duration.page, ease: ease.out, delay }}
      {...props}
    />
  );
}

/** Staggers direct `m.*` children that use `variants={fadeUp}` (or any hidden/show variants). */
export function Stagger({ step, delay, ...props }: HTMLMotionProps<"div"> & { step?: number; delay?: number }) {
  return <m.div initial="hidden" animate="show" variants={stagger(step, delay)} {...props} />;
}
