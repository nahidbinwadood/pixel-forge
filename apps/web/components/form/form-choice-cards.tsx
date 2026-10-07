"use client";

import { cn } from "cn";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import { type BaseFieldProps, FormField } from "./form-field";

export interface ChoiceCard {
  value: string;
  label: string;
  hint?: string;
  /** Visual shown above the label (e.g. an aspect-ratio preview). */
  visual?: ReactNode;
}

/**
 * One-of-many choice shown as a grid of selectable cards (presets, layouts). Arrow keys move between
 * cards (Radix radio group semantics).
 */
export function FormChoiceCards<T extends FieldValues>({
  options,
  columns = "grid-cols-2 sm:grid-cols-3",
  ...props
}: BaseFieldProps<T> & { options: readonly ChoiceCard[]; columns?: string }) {
  return (
    <FormField {...props}>
      {({ field, aria }) => (
        <RadioGroupPrimitive.Root
          {...aria}
          ref={field.ref}
          name={field.name}
          value={field.value ?? ""}
          onValueChange={field.onChange}
          disabled={field.disabled}
          className={cn("grid gap-2", columns)}
        >
          {options.map((o) => (
            <RadioGroupPrimitive.Item
              key={o.value}
              value={o.value}
              className="flex min-h-24 flex-col items-center justify-end gap-2 rounded-2xl border bg-surface-1 p-3 text-center transition-colors outline-none hover:border-primary/40 hover:bg-surface-3 focus-visible:ring-4 focus-visible:ring-ring/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary/8"
            >
              {o.visual}
              <span className="grid gap-0.5">
                <span className="text-sm font-medium">{o.label}</span>
                {o.hint && <span className="font-mono text-xs text-muted-foreground tabular-nums">{o.hint}</span>}
              </span>
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroupPrimitive.Root>
      )}
    </FormField>
  );
}
