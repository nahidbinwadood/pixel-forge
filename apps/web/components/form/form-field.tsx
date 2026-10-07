"use client";

import { cn } from "cn";
import { AnimatePresence, m } from "motion/react";
import { type ReactNode, useId } from "react";
import {
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  useController,
  useFormContext,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { duration, ease } from "@/lib/motion";

export interface FieldIds {
  control: string;
  description: string;
  error: string;
}

/** Props every Form* control accepts. */
export interface BaseFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: ReactNode;
  description?: ReactNode;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  className?: string;
  disabled?: boolean;
}

export interface FieldRenderArgs<T extends FieldValues> {
  field: ControllerRenderProps<T, FieldPath<T>>;
  fieldState: ControllerFieldState;
  ids: FieldIds;
  /** Spread onto the focusable control: id + aria-invalid + aria-describedby. */
  aria: { id: string; "aria-invalid": boolean; "aria-describedby"?: string };
}

/**
 * Shared shell for every Form* control: label, control slot, description and an animated error message,
 * all wired with ids/ARIA. Controls only render the input itself (render-prop pattern).
 */
export function FormField<T extends FieldValues>({
  name,
  label,
  description,
  hideLabel,
  className,
  disabled,
  layout = "stack",
  children,
}: BaseFieldProps<T> & {
  /** "inline" puts the control before the label (checkbox/switch rows). */
  layout?: "stack" | "inline";
  children: (args: FieldRenderArgs<T>) => ReactNode;
}) {
  const { control } = useFormContext<T>();
  const { field, fieldState } = useController<T>({ name, control, disabled });
  const base = useId();
  const ids: FieldIds = { control: `${base}-control`, description: `${base}-desc`, error: `${base}-error` };
  const error = fieldState.error?.message;
  const describedBy = [description ? ids.description : null, error ? ids.error : null].filter(Boolean).join(" ");
  const aria = { id: ids.control, "aria-invalid": Boolean(error), "aria-describedby": describedBy || undefined };

  const labelEl = (
    <Label htmlFor={ids.control} className={cn(hideLabel && "sr-only", layout === "inline" && "font-normal")}>
      {label}
    </Label>
  );

  return (
    <div className={cn("grid gap-2", className)} data-invalid={Boolean(error) || undefined}>
      {layout === "inline" ? (
        <div className="flex items-start gap-3">
          {children({ field, fieldState, ids, aria })}
          <div className="grid gap-1 pt-0.5">
            {labelEl}
            {description && (
              <p id={ids.description} className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {labelEl}
          {children({ field, fieldState, ids, aria })}
          {description && (
            <p id={ids.description} className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </>
      )}
      <AnimatePresence initial={false}>
        {error && (
          <m.p
            key={error}
            id={ids.error}
            role="alert"
            className="text-sm font-medium text-destructive"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: duration.micro, ease: ease.out }}
          >
            {error}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}
