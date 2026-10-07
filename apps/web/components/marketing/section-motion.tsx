"use client";

import { type HTMLMotionProps, m } from "motion/react";
import { duration, ease, liftHover } from "@/lib/motion";

/** Card with the shared hover lift + press. Children use `group-hover:` for image zoom. */
export function SectionLiftCard(props: HTMLMotionProps<"article">) {
  return <m.article {...liftHover} {...props} />;
}

/** Children rise in with a stagger as the group scrolls into view. */
export function SectionStagger({ step = 0.08, ...props }: HTMLMotionProps<"div"> & { step?: number }) {
  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: step } } }}
      {...props}
    />
  );
}

/** One staggered child (pair with SectionStagger). */
export function SectionItem(props: HTMLMotionProps<"div">) {
  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: duration.page, ease: ease.out } },
      }}
      {...props}
    />
  );
}
