"use client";

import type { FieldValues } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { type BaseFieldProps, FormField } from "./form-field";

/** On/off setting that takes effect as a preference (notifications, flags). */
export function FormSwitch<T extends FieldValues>(props: BaseFieldProps<T>) {
  return (
    <FormField {...props} layout="inline">
      {({ field, aria }) => (
        <Switch
          {...aria}
          ref={field.ref}
          name={field.name}
          checked={Boolean(field.value)}
          onCheckedChange={field.onChange}
          onBlur={field.onBlur}
          disabled={field.disabled}
        />
      )}
    </FormField>
  );
}
