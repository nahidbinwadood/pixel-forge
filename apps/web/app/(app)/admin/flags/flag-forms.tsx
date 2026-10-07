"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createFlag, updateFlag } from "@/lib/admin";

/** Parses the rules textarea. Empty = no targeting (everyone). Server re-validates the shape. */
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

export function FlagRow(props: { flagKey: string; description: string | null; enabled: boolean; rules: string }) {
  const t = useTranslations("admin");
  const [pending, start] = useTransition();
  const [enabled, setEnabled] = useState(props.enabled);
  const [rules, setRules] = useState(props.rules);
  const invalid = !parseRules(rules).ok;
  const id = `flag-${props.flagKey}`;

  function save(nextEnabled: boolean) {
    const parsed = parseRules(rules);
    if (!parsed.ok) return toast.error("Rules must be a JSON object or empty");
    start(async () => {
      const r = await updateFlag(props.flagKey, nextEnabled, parsed.value);
      if (r.ok) {
        setEnabled(nextEnabled);
        toast.success(t("updated"));
      } else toast.error(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-start">
      <div className="flex min-w-56 flex-col gap-1">
        <code className="font-mono text-sm font-medium">{props.flagKey}</code>
        {props.description && <span className="text-xs text-muted-foreground">{props.description}</span>}
        <div className="mt-2 flex items-center gap-2">
          <Switch
            id={`${id}-on`}
            aria-label={`${t("enabled")}: ${props.flagKey}`}
            checked={enabled}
            disabled={pending}
            onCheckedChange={(v) => save(v)}
          />
          <Label htmlFor={`${id}-on`}>{t("enabled")}</Label>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor={`${id}-rules`}>
          {t("rules")} <span className="font-normal text-muted-foreground">(empty = {t("everyone")})</span>
        </Label>
        <textarea
          id={`${id}-rules`}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={3}
          spellCheck={false}
          aria-invalid={invalid}
          placeholder='{"roles": ["admin"], "percent": 10}'
          className="w-full rounded-md border bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
        <div>
          <Button size="sm" variant="outline" disabled={pending || invalid} onClick={() => save(enabled)}>
            Save rules
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CreateFlagForm({ keyLabel }: { keyLabel: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-3 md:flex-row md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        start(async () => {
          const r = await createFlag(String(data.get("key")), String(data.get("description") ?? ""));
          if (r.ok) {
            form.reset();
            toast.success("Flag created");
          } else toast.error(r.error);
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="new-flag-key">{keyLabel}</Label>
        <Input id="new-flag-key" name="key" required pattern="[a-z0-9_.\-]{2,64}" placeholder="editor.new_tool" />
      </div>
      <div className="grid flex-1 gap-2">
        <Label htmlFor="new-flag-desc">Description</Label>
        <Input id="new-flag-desc" name="description" maxLength={200} />
      </div>
      <Button type="submit" disabled={pending}>
        Create
      </Button>
    </form>
  );
}
