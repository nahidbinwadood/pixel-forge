"use client";

import type { ComponentProps, ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { type BaseFieldProps, FormField } from "./form-field";

type InputProps = Omit<ComponentProps<typeof Input>, "name" | "defaultValue" | "value" | "onChange" | "disabled">;

/** Text-like input (text, email, url, number, search…). For passwords use FormPassword. */
export function FormInput<T extends FieldValues>({
  name,
  label,
  description,
  hideLabel,
  className,
  disabled,
  startIcon,
  ...input
}: BaseFieldProps<T> & InputProps & { startIcon?: ReactNode }) {
  return (
    <FormField
      name={name}
      label={label}
      description={description}
      hideLabel={hideLabel}
      className={className}
      disabled={disabled}
    >
      {({ field, aria }) => (
        <div className="relative">
          {startIcon && (
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground [&_svg]:size-4">
              {startIcon}
            </span>
          )}
          <Input
            {...input}
            {...aria}
            name={field.name}
            ref={field.ref}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(input.type === "number" ? e.target.valueAsNumber : e.target.value)}
            onBlur={field.onBlur}
            disabled={field.disabled}
            className={startIcon ? "ps-9" : undefined}
          />
        </div>
      )}
    </FormField>
  );
}
