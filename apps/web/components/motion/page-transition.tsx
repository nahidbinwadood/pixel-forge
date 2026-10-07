"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { duration, ease } from "@/lib/motion";

/** Wraps page content in app/template.tsx-style entry animation. Keeps it short so it never delays content. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.panel, ease: ease.out }}
    >
      {children}
    </m.div>
  );
}
