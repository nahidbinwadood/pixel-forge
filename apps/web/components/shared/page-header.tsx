import { cn } from "cn";
import type { ReactNode } from "react";

/** Page title row: display-font H1, optional description, one primary action on the end. */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="grid gap-1.5">
        <h1 className="text-h1">{title}</h1>
        {description && <p className="max-w-2xl text-text-2">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/** Keyboard shortcut hint. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 bg-surface-1 px-1 font-mono text-[11px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
