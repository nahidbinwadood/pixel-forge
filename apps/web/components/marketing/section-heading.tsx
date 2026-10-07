import { cn } from "cn";
import type { ReactNode } from "react";

/** Mono micro-label ("— HOW IT WORKS") + display title + optional body. Server component. */
export function SectionHeading({
  label,
  title,
  body,
  align = "start",
  className,
  id,
}: {
  label: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "start" | "center";
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "grid max-w-2xl gap-4",
        align === "center" && "mx-auto justify-items-center text-center",
        className,
      )}
    >
      <p className="flex items-center gap-2 font-mono text-xs font-medium tracking-[0.14em] text-primary uppercase">
        <span aria-hidden className="h-px w-6 bg-primary" />
        {label}
      </p>
      <h2 id={id} className="text-display text-balance">
        {title}
      </h2>
      {body && <p className="text-lg text-pretty text-text-2">{body}</p>}
    </div>
  );
}

/** Status pill used on tiles: "Available today" / "Coming soon". */
export function SectionStatus({ live, children }: { live?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        live ? "border-success/30 bg-success/10 text-success" : "bg-surface-1/80 text-text-2 backdrop-blur",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", live ? "bg-success" : "bg-muted-foreground")} />
      {children}
    </span>
  );
}
