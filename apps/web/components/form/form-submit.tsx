"use client";

import type { ComponentProps } from "react";
import { useFormState } from "react-hook-form";
import { Button } from "@/components/ui/button";

/** Submit button that shows a spinner and disables itself while the form submits. */
export function FormSubmit(props: Omit<ComponentProps<typeof Button>, "type">) {
  const { isSubmitting } = useFormState();
  return <Button type="submit" loading={isSubmitting} {...props} />;
}

/** Form-level error (server/root errors set with `form.setError("root", …)`). */
export function FormRootError() {
  const { errors } = useFormState();
  const message = errors.root?.message;
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}
