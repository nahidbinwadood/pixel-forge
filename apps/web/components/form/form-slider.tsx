"use client";

import type { FieldValues } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { type BaseFieldProps, FormField } from "./form-field";

/** Numeric range with gradient track (heavily used in the editor). Value is a number. */
export function FormSlider<T extends FieldValues>({
  min = 0,
  max = 100,
  step = 1,
  format = (v: number) => String(v),
  ...props
}: BaseFieldProps<T> & { min?: number; max?: number; step?: number; format?: (v: number) => string }) {
  return (
    <FormField {...props}>
      {({ field, aria }) => (
        <div className="flex items-center gap-3">
          <Slider
            {...aria}
            ref={field.ref}
            name={field.name}
            min={min}
            max={max}
            step={step}
            value={[Number(field.value ?? min)]}
            onValueChange={([v]) => field.onChange(v)}
            onBlur={field.onBlur}
            disabled={field.disabled}
            className="flex-1"
          />
          <output htmlFor={aria.id} className="w-12 text-end font-mono text-sm tabular-nums text-text-2">
            {format(Number(field.value ?? min))}
          </output>
        </div>
      )}
    </FormField>
  );
}
