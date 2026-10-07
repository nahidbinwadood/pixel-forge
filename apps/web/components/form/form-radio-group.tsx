"use client";

import type { FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type BaseFieldProps, FormField } from "./form-field";
import type { Option } from "./form-select";

/** One-of-few choice, all options visible (2–5 options). */
export function FormRadioGroup<T extends FieldValues>({
  options,
  orientation = "vertical",
  ...props
}: BaseFieldProps<T> & { options: readonly Option[]; orientation?: "vertical" | "horizontal" }) {
  return (
    <FormField {...props}>
      {({ field, aria }) => (
        <RadioGroup
          {...aria}
          ref={field.ref}
          name={field.name}
          value={field.value ?? ""}
          onValueChange={field.onChange}
          disabled={field.disabled}
          className={orientation === "horizontal" ? "flex flex-wrap gap-4" : "grid gap-2.5"}
        >
          {options.map((o) => (
            <div key={o.value} className="flex items-center gap-2">
              <RadioGroupItem id={`${aria.id}-${o.value}`} value={o.value} disabled={o.disabled} />
              <Label htmlFor={`${aria.id}-${o.value}`} className="cursor-pointer font-normal">
                {o.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </FormField>
  );
}
