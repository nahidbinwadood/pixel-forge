"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";
import { Switch } from "@/components/ui/switch";
import { createFlag, updateFlag } from "@/lib/admin";
import { spring } from "@/lib/motion";

/** Rules text → value. Empty = no targeting (everyone). The server re-validates the exact shape. */
function parseRules(text: string): { ok: true; value: unknown } | { ok: false } {
  if (!text.trim()) return { ok: true, value: null };
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== "object" || value === null || Array.isArray(value)) return { ok: false };
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}

export function FlagCard(props: { flagKey: string; description: string | null; enabled: boolean; rules: string }) {
  const t = useTranslations("admin");
  const [enabled, setEnabled] = useState(props.enabled);
  const [pending, start] = useTransition();
  const schema = z.object({ rules: z.string().refine((s) => parseRules(s).ok, t("rulesInvalid")) });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { rules: props.rules },
    mode: "onChange",
  });

  async function save(nextEnabled: boolean, rulesText: string) {
    const parsed = parseRules(rulesText);
    if (!parsed.ok) return false;
    const r = await updateFlag(props.flagKey, nextEnabled, parsed.value);
    if (r.ok) toast.success(t("updated"));
    else toast.error(r.error);
    return r.ok;
  }

  const toggle = (next: boolean) =>
    start(async () => {
      const prev = enabled;
      setEnabled(next); // optimistic; rolled back on failure
      if (!(await save(next, form.getValues("rules")))) setEnabled(prev);
    });

  return (
    <m.article
      layout
      transition={spring.ui}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 surface-highlight transition-colors",
        enabled && "border-primary/30",
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <code className="truncate font-mono text-sm font-medium">{props.flagKey}</code>
          {props.description && <p className="text-sm text-muted-foreground">{props.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("text-xs font-medium", enabled ? "text-primary" : "text-muted-foreground")} aria-hidden>
            {t("enabled")}
          </span>
          <Switch
            aria-label={`${t("enabled")}: ${props.flagKey}`}
            checked={enabled}
            disabled={pending}
            onCheckedChange={toggle}
          />
        </div>
      </header>
      <Form
        form={form}
        onSubmit={async ({ rules }) => {
          await save(enabled, rules);
        }}
        className="gap-3"
      >
        <FormTextarea<Values>
          name="rules"
          label={t("rules")}
          description={t("rulesHint")}
          rows={3}
          spellCheck={false}
          placeholder='{"roles": ["admin"], "percent": 10}'
          className="[&_textarea]:font-mono [&_textarea]:text-xs"
        />
        <FormSubmit variant="secondary" size="sm" className="self-start" disabled={!form.formState.isDirty}>
          {t("saveRules")}
        </FormSubmit>
      </Form>
    </m.article>
  );
}

export function CreateFlagForm() {
  const t = useTranslations("admin");
  const schema = z.object({
    key: z
      .string()
      .trim()
      .regex(/^[a-z0-9_.-]{2,64}$/, t("keyInvalid")),
    description: z.string().trim().max(200),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { key: "", description: "" } });

  async function create(values: Values) {
    const r = await createFlag(values.key, values.description);
    if (!r.ok) return form.setError("key", { message: r.error });
    form.reset();
    toast.success(t("flagCreated"));
  }

  return (
    <Form form={form} onSubmit={create} className="gap-4">
      <FormInput<Values>
        name="key"
        label={t("flagKey")}
        placeholder="editor.new_tool"
        autoComplete="off"
        spellCheck={false}
        className="[&_input]:font-mono"
      />
      <FormInput<Values> name="description" label={t("flagDescription")} maxLength={200} />
      <FormSubmit className="self-start">{t("create")}</FormSubmit>
    </Form>
  );
}
