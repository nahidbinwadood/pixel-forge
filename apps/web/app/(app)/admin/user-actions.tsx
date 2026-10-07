"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grantCredits, setBanned, setPlan, setRole } from "@/lib/admin";

type Result = { ok: true } | { ok: false; error: string };

export function UserActions(props: {
  userId: string;
  email: string;
  role: string;
  planId: string;
  banned: boolean;
  isSelf: boolean;
  planIds: string[];
}) {
  const t = useTranslations("admin");
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("");

  const act = (fn: () => Promise<Result>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(t("updated"));
        after?.();
      } else toast.error(r.error);
    });

  const id = props.userId;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2" aria-busy={pending}>
      <Select value={props.role} disabled={pending || props.isSelf} onValueChange={(v) => act(() => setRole(id, v))}>
        <SelectTrigger size="sm" aria-label={`${t("role")}: ${props.email}`} className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">user</SelectItem>
          <SelectItem value="admin">admin</SelectItem>
        </SelectContent>
      </Select>

      <Select value={props.planId} disabled={pending} onValueChange={(v) => act(() => setPlan(id, v))}>
        <SelectTrigger size="sm" aria-label={`${t("plan")}: ${props.email}`} className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {props.planIds.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount);
          if (!Number.isInteger(n) || n === 0) return toast.error("Enter a non-zero whole number");
          act(
            () => grantCredits(id, n, ""),
            () => setAmount(""),
          );
        }}
      >
        <label htmlFor={`grant-${id}`} className="sr-only">
          {`${t("grant")}: ${props.email}`}
        </label>
        <Input
          id={`grant-${id}`}
          type="number"
          inputMode="numeric"
          min={-10000}
          max={10000}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-8 w-20"
          placeholder="±"
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending || !amount}>
          {t("grant")}
        </Button>
      </form>

      {!props.isSelf && (
        <Button
          size="sm"
          variant={props.banned ? "outline" : "destructive"}
          disabled={pending}
          onClick={() => act(() => setBanned(id, !props.banned))}
          aria-label={`${props.banned ? t("unban") : t("ban")} ${props.email}`}
        >
          {props.banned ? t("unban") : t("ban")}
        </Button>
      )}
    </div>
  );
}
