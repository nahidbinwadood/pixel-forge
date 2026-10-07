"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormSubmit } from "@/components/form/form-submit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { grantCredits, setBanned, setPlan, setRole } from "@/lib/admin";
import type { AdminUserRow } from "./user-row-actions";

type Result = { ok: true } | { ok: false; error: string };

/** Side panel with every per-user admin control. All changes go through audited server actions. */
export function UserSheet({
  open,
  onOpenChange,
  ...user
}: AdminUserRow & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("admin");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="font-display text-xl">{t("manage")}</SheetTitle>
          <SheetDescription className="truncate font-mono">{user.email}</SheetDescription>
          <p className="text-xs text-muted-foreground">{t("manageDesc")}</p>
        </SheetHeader>
        <div className="flex flex-col divide-y">
          <SheetBlock title={t("role")}>
            <RoleForm {...user} />
          </SheetBlock>
          <SheetBlock title={t("plan")}>
            <PlanForm {...user} />
          </SheetBlock>
          <SheetBlock title={t("grant")}>
            <GrantForm {...user} />
          </SheetBlock>
          {!user.isSelf && (
            <SheetBlock title={t("access")}>
              <BanControl {...user} />
            </SheetBlock>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SheetBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 p-4">
      <h3 className="font-sans text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function useAction() {
  const t = useTranslations("admin");
  return async (fn: () => Promise<Result>) => {
    const r = await fn();
    if (r.ok) toast.success(t("updated"));
    else toast.error(r.error);
    return r.ok;
  };
}

function RoleForm({ userId, role, isSelf }: AdminUserRow) {
  const t = useTranslations("admin");
  const act = useAction();
  const schema = z.object({ role: z.enum(["user", "admin"]) });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: role === "admin" ? "admin" : "user" },
  });

  return (
    <Form
      form={form}
      onSubmit={({ role: next }) => act(() => setRole(userId, next))}
      className="flex-row items-end gap-2"
    >
      <FormSelect<Values>
        name="role"
        label={t("role")}
        hideLabel
        disabled={isSelf}
        description={isSelf ? t("roleSelf") : undefined}
        options={[
          { value: "user", label: "user" },
          { value: "admin", label: "admin" },
        ]}
        className="flex-1"
      />
      {!isSelf && (
        <FormSubmit variant="secondary" size="sm" className="h-10">
          {t("saveRole")}
        </FormSubmit>
      )}
    </Form>
  );
}

function PlanForm({ userId, planId, planIds }: AdminUserRow) {
  const t = useTranslations("admin");
  const act = useAction();
  const schema = z.object({ planId: z.string().refine((p) => planIds.includes(p)) });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { planId } });

  return (
    <Form
      form={form}
      onSubmit={({ planId: next }) => act(() => setPlan(userId, next))}
      className="flex-row items-end gap-2"
    >
      <FormSelect<Values>
        name="planId"
        label={t("plan")}
        hideLabel
        options={planIds.map((p) => ({ value: p, label: p }))}
        className="flex-1"
      />
      <FormSubmit variant="secondary" size="sm" className="h-10">
        {t("savePlan")}
      </FormSubmit>
    </Form>
  );
}

function GrantForm({ userId, email }: AdminUserRow) {
  const t = useTranslations("admin");
  const act = useAction();
  const schema = z.object({
    amount: z
      .number({ error: t("amountInvalid") })
      .int(t("amountInvalid"))
      .min(-10_000, t("amountInvalid"))
      .max(10_000, t("amountInvalid"))
      .refine((n) => n !== 0, t("amountInvalid")),
    note: z.string().trim().max(200),
  });
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { amount: Number.NaN, note: "" } });

  async function grant(values: Values) {
    const ok = await act(() => grantCredits(userId, Number(values.amount), values.note));
    if (ok) form.reset({ amount: Number.NaN, note: "" });
  }

  return (
    <Form form={form} onSubmit={grant} className="gap-3">
      <FormInput<Values>
        name="amount"
        type="number"
        inputMode="numeric"
        step={1}
        placeholder="±"
        // Accessible name includes the email so rows are unambiguous for AT and tests.
        label={
          <>
            {t("grant")}
            <span className="sr-only">: {email}</span>
          </>
        }
        description={t("amountHint")}
      />
      <FormInput<Values> name="note" label={t("note")} maxLength={200} />
      <FormSubmit variant="secondary" className="self-start">
        {t("grant")}
      </FormSubmit>
    </Form>
  );
}

function BanControl({ userId, banned }: AdminUserRow) {
  const t = useTranslations("admin");
  const act = useAction();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("banDesc")}</p>
      <div className="flex items-center gap-3">
        {banned && <Badge variant="destructive">{t("banned")}</Badge>}
        <Button
          variant={banned ? "outline" : "destructive"}
          size="sm"
          loading={pending}
          onClick={() => start(async () => void (await act(() => setBanned(userId, !banned))))}
        >
          {banned ? t("unban") : t("ban")}
        </Button>
      </div>
    </div>
  );
}
