"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useEffect, useRef } from "react";
import { type DefaultValues, type FieldValues, type UseFormReturn, useForm } from "react-hook-form";
import type { z } from "zod";
import { Form } from "@/components/form/form";

/**
 * A react-hook-form + zod form that edits the document live: every valid user change calls `commit`
 * with the field name and the parsed values. `values` re-syncs the form after undo/redo or canvas edits.
 */
export function useLiveForm<T extends FieldValues>(
  schema: z.ZodType<T, T>,
  values: T,
  commit: (name: string, value: T) => void,
): UseFormReturn<T, unknown, T> {
  const form = useForm<T, unknown, T>({
    resolver: zodResolver(schema),
    defaultValues: values as DefaultValues<T>,
    values,
    mode: "onChange",
  });
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    const sub = form.watch((all, { name, type }) => {
      if (!name || type !== "change") return;
      const parsed = schema.safeParse(all);
      if (parsed.success) commitRef.current(name, parsed.data);
    });
    return () => sub.unsubscribe();
  }, [form, schema]);

  return form;
}

export function LiveForm<T extends FieldValues>({ form, children }: { form: UseFormReturn<T>; children: ReactNode }) {
  return (
    <Form form={form} onSubmit={() => undefined} className="gap-4">
      {children}
    </Form>
  );
}

/** Panel section with a heading. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-b px-4 py-4 last:border-b-0">
      <h3 className="text-xs font-semibold tracking-wide text-text-2 uppercase">{title}</h3>
      {children}
    </section>
  );
}
