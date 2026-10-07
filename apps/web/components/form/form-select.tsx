"use client";

import type { FieldValues } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type BaseFieldProps, FormField } from "./form-field";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Select from a short, fixed list (≲ 10 options). For long or searchable lists use FormCombobox. */
export function FormSelect<T extends FieldValues>({
  options,
  placeholder = "Select…",
  ...props
}: BaseFieldProps<T> & { options: readonly Option[]; placeholder?: string }) {
  return (
    <FormField {...props}>
      {({ field, aria }) => (
        <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={field.disabled} name={field.name}>
          <SelectTrigger {...aria} ref={field.ref} onBlur={field.onBlur} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
