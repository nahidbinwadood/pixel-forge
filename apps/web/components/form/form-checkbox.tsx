"use client";

import type { FieldValues } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { type BaseFieldProps, FormField } from "./form-field";

/** Single boolean with a visible label beside the box (terms, preferences). */
export function FormCheckbox<T extends FieldValues>(props: BaseFieldProps<T>) {
  return (
    <FormField {...props} layout="inline">
      {({ field, aria }) => (
        <Checkbox
          {...aria}
          ref={field.ref}
          name={field.name}
          checked={Boolean(field.value)}
          onCheckedChange={(v) => field.onChange(v === true)}
          onBlur={field.onBlur}
          disabled={field.disabled}
          className="mt-0.5"
        />
      )}
    </FormField>
  );
}
