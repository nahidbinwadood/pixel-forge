"use client";

import { cn } from "cn";
import { ReceiptTextIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { listItem } from "@/lib/motion";

export interface LedgerRow {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  tool: string | null;
  createdAt: string;
}

const REASONS = new Set(["monthly_grant", "admin_grant", "job_charge", "job_refund", "purchase"]);

/** Credit ledger list with cursor pagination. Amounts carry +/− signs, so color is never the only signal. */
export function UsageTable({ initial, initialCursor }: { initial: LedgerRow[]; initialCursor: string | null }) {
  const t = useTranslations("ai.usage");
  const tt = useTranslations("ai.tools");
  const format = useFormatter();
  const [rows, setRows] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const more = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/credits/ledger?cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: LedgerRow[]; nextCursor: string | null };
      setRows((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (rows.length === 0) return <EmptyState icon={<ReceiptTextIcon />} title={t("empty")} />;

  const label = (r: LedgerRow) => {
    const tool = r.tool === "text_to_image" || r.tool === "bg_remove" || r.tool === "write" ? tt(`${r.tool}.name`) : "";
    return REASONS.has(r.reason) ? t(`reasons.${r.reason}` as "reasons.job_charge", { tool }) : r.reason;
  };

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-2xl border bg-surface-2 surface-highlight">
        <table className="w-full text-sm">
          <thead className="border-b bg-surface-1 text-start text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("colDate")}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("colWhat")}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium">
                {t("colAmount")}
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <m.tr key={r.id} variants={listItem} initial="hidden" animate="show" className="border-b last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {format.dateTime(new Date(r.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">{label(r)}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-end font-mono tabular-nums",
                      r.delta > 0 ? "text-success" : "text-foreground",
                    )}
                  >
                    {r.delta > 0 ? `+${r.delta}` : `−${Math.abs(r.delta)}`}
                  </td>
                </m.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("loadError")}
        </p>
      )}
      {cursor && (
        <Button variant="secondary" onClick={more} loading={loading} className="w-fit">
          {t("loadMore")}
        </Button>
      )}
    </div>
  );
}
