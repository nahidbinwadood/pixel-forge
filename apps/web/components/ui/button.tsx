"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Loader2Icon } from "lucide-react";
import { type HTMLMotionProps, m } from "motion/react";
import { Slot } from "radix-ui";
import type * as React from "react";
import { pressable } from "@/lib/motion";

/**
 * Pill buttons. `default` = solid violet primary (one per view) with the light-sweep sheen on hover;
 * `aurora` = transformation/AI actions only; `premium` = flare gradient, upsells only.
 */
const buttonVariants = cva(
  "group/button relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,opacity] duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary-solid text-white font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_24px_-8px_rgb(91_63_224/0.65)] hover:bg-primary-solid/90 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_12px_32px_-8px_rgb(91_63_224/0.8)] after:pointer-events-none after:absolute after:inset-y-0 after:-left-1/3 after:w-1/3 after:-skew-x-12 after:bg-white/25 after:opacity-0 after:blur-md hover:after:animate-sweep hover:after:opacity-100",
        /** Transformation / AI actions only (AUDIT §3). */
        aurora:
          "bg-aurora text-aurora-ink font-semibold shadow-glow hover:shadow-[0_0_48px_-8px_rgb(124_92_255/0.7)] after:pointer-events-none after:absolute after:inset-y-0 after:-left-1/3 after:w-1/3 after:-skew-x-12 after:bg-white/35 after:opacity-0 after:blur-md hover:after:animate-sweep hover:after:opacity-100",
        /** High-contrast neutral (ink on light, white on dark): secondary CTAs on marketing pages. */
        contrast: "bg-foreground text-background font-semibold hover:bg-foreground/85",
        premium: "bg-premium text-aurora-ink font-semibold hover:brightness-105",
        secondary: "bg-secondary text-secondary-foreground surface-highlight hover:bg-surface-3",
        outline: "border-input bg-transparent hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary",
        ghost: "hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary",
        glass: "glass text-foreground hover:bg-surface-3/80",
        destructive: "bg-destructive/12 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/30",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 gap-1.5 px-3.5 text-[0.8125rem]",
        lg: "h-12 px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    children?: React.ReactNode;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild) {
    // Slot can't be a motion component; CSS press feedback keeps links consistent with buttons.
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        className={cn(classes, "transition-transform active:scale-[0.97]")}
        {...(props as React.ComponentProps<"button">)}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <m.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...pressable}
      {...props}
    >
      {loading && <Loader2Icon className="animate-spin" aria-hidden />}
      {children}
    </m.button>
  );
}

export { Button, buttonVariants };
