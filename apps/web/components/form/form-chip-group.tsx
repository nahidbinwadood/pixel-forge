"use client";

import { cn } from "cn";
import { m } from "motion/react";
import { type KeyboardEvent, type ReactNode, useId, useRef } from "react";
import type { FieldValues } from "react-hook-form";
import { spring } from "@/lib/motion";
import { type BaseFieldProps, FormField } from "./form-field";

export interface ChipOption<V extends string | number = string> {
  value: V;
  label: string;
  /** Custom chip body (e.g. a thumbnail); `label` stays the accessible name. */
  content?: ReactNode;
  disabled?: boolean;
}

/**
 * Single choice shown as pill chips (style presets, aspect ratios, counts, image pickers).
 * ARIA radiogroup with roving focus: Tab enters at the selected chip, arrow keys move and select.
 */
export function FormChipGroup<T extends FieldValues, V extends string | number = string>({
  options,
  listClassName,
  chipClassName,
  ...props
}: BaseFieldProps<T> & {
  options: readonly ChipOption<V>[];
  listClassName?: string;
  /** Override chip styling (e.g. square image tiles). */
  chipClassName?: string;
}) {
  const layoutId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <FormField {...props}>
      {({ field, aria }) => {
        const enabled = options.filter((o) => !o.disabled);
        const selectedIndex = options.findIndex((o) => o.value === field.value);
        const focusIndex = selectedIndex >= 0 ? selectedIndex : options.indexOf(enabled[0] as ChipOption<V>);
        const onKey = (e: KeyboardEvent, i: number) => {
          const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!dir) return;
          e.preventDefault();
          for (let step = 1; step <= options.length; step++) {
            const j = (i + dir * step + options.length) % options.length;
            const o = options[j];
            if (o && !o.disabled) {
              field.onChange(o.value);
              refs.current[j]?.focus();
              return;
            }
          }
        };
        return (
          <div
            role="radiogroup"
            id={aria.id}
            aria-invalid={aria["aria-invalid"]}
            aria-describedby={aria["aria-describedby"]}
            aria-label={typeof props.label === "string" ? props.label : undefined}
            className={cn("flex flex-wrap gap-2", listClassName)}
          >
            {options.map((o, i) => {
              const active = o.value === field.value;
              return (
                <m.button
                  key={String(o.value)}
                  ref={(el) => {
                    refs.current[i] = el;
                    if (i === focusIndex) field.ref(el);
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={o.content ? o.label : undefined}
                  tabIndex={i === focusIndex ? 0 : -1}
                  disabled={o.disabled || field.disabled}
                  onClick={() => field.onChange(o.value)}
                  onKeyDown={(e) => onKey(e, i)}
                  onBlur={field.onBlur}
                  whileTap={{ scale: 0.95 }}
                  transition={spring.snappy}
                  className={cn(
                    "relative isolate rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50",
                    active ? "border-transparent text-primary-foreground" : "text-text-2 hover:text-foreground",
                    chipClassName,
                  )}
                >
                  {active && (
                    <m.span
                      layoutId={layoutId}
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-[inherit] bg-primary"
                      transition={spring.ui}
                    />
                  )}
                  {o.content ?? o.label}
                </m.button>
              );
            })}
          </div>
        );
      }}
    </FormField>
  );
}
