"use client";

import type { ComponentProps } from "react";
import { type FieldValues, useWatch } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { type BaseFieldProps, FormField } from "./form-field";

type TextareaProps = Omit<ComponentProps<typeof Textarea>, "name" | "defaultValue" | "value" | "onChange" | "disabled">;

/** Multi-line text. Pass `maxLength` to get a live character counter. */
export function FormTextarea<T extends FieldValues>({
  name,
  label,
  description,
  hideLabel,
  className,
  disabled,
  ...textarea
}: BaseFieldProps<T> & TextareaProps) {
  const value = useWatch<T>({ name }) as string | undefined;
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
          <Textarea
            {...textarea}
            {...aria}
            name={field.name}
            ref={field.ref}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
          />
          {textarea.maxLength && (
            <span
              className="pointer-events-none absolute end-3 bottom-2 font-mono text-xs text-muted-foreground"
              aria-hidden
            >
              {value?.length ?? 0}/{textarea.maxLength}
            </span>
          )}
        </div>
      )}
    </FormField>
  );
}
