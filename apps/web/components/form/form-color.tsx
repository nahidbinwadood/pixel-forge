"use client";

import type { FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { type BaseFieldProps, FormField } from "./form-field";

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Color picker: native swatch (keyboard + OS picker) plus a hex text field. Value is `#rrggbb`.
 * The text field only commits complete hex values, so partial typing never writes an invalid color.
 */
export function FormColor<T extends FieldValues>(props: BaseFieldProps<T>) {
  return (
    <FormField {...props}>
      {({ field, aria }) => {
        const value = HEX.test(String(field.value ?? "")) ? String(field.value) : "#000000";
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              {...aria}
              ref={field.ref}
              value={value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              disabled={field.disabled}
              className="size-10 shrink-0 cursor-pointer rounded-sm border border-input bg-surface-1 p-1 focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none"
            />
            <Input
              key={value}
              aria-label={typeof props.label === "string" ? `${props.label} hex` : "Hex color"}
              defaultValue={value}
              maxLength={7}
              spellCheck={false}
              disabled={field.disabled}
              className="font-mono uppercase"
              onChange={(e) => {
                const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                if (HEX.test(v)) field.onChange(v.toLowerCase());
              }}
            />
          </div>
        );
      }}
    </FormField>
  );
}
