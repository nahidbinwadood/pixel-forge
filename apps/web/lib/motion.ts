/**
 * Motion presets (CLAUDE.md "Motion"). Every animation in the app uses these: no ad-hoc timings.
 * Import components as `m` from "motion/react" (LazyMotion is set up in components/motion/motion-provider).
 */
import type { Transition, Variants } from "motion/react";

export const ease = {
  out: [0.22, 1, 0.36, 1] as const, // entrances
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const duration = { micro: 0.15, panel: 0.28, page: 0.6 } as const;

export const spring = {
  /** Default UI spring: buttons, toggles, layout. */
  ui: { type: "spring", stiffness: 300, damping: 30 } satisfies Transition,
  /** Snappier: press feedback, small chips. */
  snappy: { type: "spring", stiffness: 500, damping: 32 } satisfies Transition,
  /** Softer: panels, sheets, hero elements. */
  soft: { type: "spring", stiffness: 180, damping: 26 } satisfies Transition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: duration.page, ease: ease.out } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.panel, ease: ease.out } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: spring.ui },
  exit: { opacity: 0, scale: 0.96, transition: { duration: duration.micro } },
};

/** Parent variant that staggers its children (use with fadeUp/scaleIn children). */
export const stagger = (step = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

/** Hover lift + press for cards and tiles. */
export const liftHover = {
  whileHover: { y: -3, transition: spring.ui },
  whileTap: { scale: 0.98, transition: spring.snappy },
} as const;

/** Press feedback for buttons. */
export const pressable = { whileTap: { scale: 0.97, transition: spring.snappy } } as const;

/** List item add/remove (use inside AnimatePresence with `layout`). */
export const listItem: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: spring.ui },
  exit: { opacity: 0, scale: 0.92, transition: { duration: duration.micro } },
};
