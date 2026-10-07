"use client";

import { cn } from "cn";
import type { ComponentProps } from "react";
import { type FieldValues, FormProvider, type SubmitHandler, type UseFormReturn } from "react-hook-form";

/**
 * Form root (CLAUDE.md "Forms"). Provides react-hook-form context to every Form* control inside.
 *
 *   const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues });
 *   <Form form={form} onSubmit={save}>
 *     <FormInput name="email" label="Email" />
 *     <FormSubmit>Save changes</FormSubmit>
 *   </Form>
 */
export function Form<T extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
  ...props
}: Omit<ComponentProps<"form">, "onSubmit"> & { form: UseFormReturn<T>; onSubmit: SubmitHandler<T> }) {
  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-5", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}
