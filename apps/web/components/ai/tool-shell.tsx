import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Shared AI tool layout: controls (left) · result (center) · history (right).
 * Stacks on small screens with the result between controls and history. Pure composition, no state.
 */
export function ToolShell({
  title,
  backLabel,
  meta,
  notice,
  controls,
  result,
  history,
}: {
  title: string;
  backLabel: string;
  meta?: ReactNode;
  notice?: ReactNode;
  controls: ReactNode;
  result: ReactNode;
  history: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <Button asChild variant="ghost" size="sm" className="-ms-3 w-fit text-text-2">
            <Link href="/ai">
              <ArrowLeftIcon aria-hidden />
              {backLabel}
            </Link>
          </Button>
          <h1 className="text-h1">{title}</h1>
        </div>
        {meta}
      </div>
      {notice}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_17rem]">
        <section aria-label="Controls" className="rounded-2xl border bg-surface-2 p-5 surface-highlight">
          {controls}
        </section>
        <section aria-live="polite" aria-label="Result" className="min-w-0">
          {result}
        </section>
        <aside className="lg:col-span-2 xl:col-span-1">{history}</aside>
      </div>
    </div>
  );
}
