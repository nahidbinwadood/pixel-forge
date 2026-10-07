import { cn } from "cn";
import type { ReactNode } from "react";

/** One anchored settings section: heading + one-line purpose, then its cards. */
export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-5">
      <header className="grid gap-1">
        <h2 id={`${id}-title`} className="text-h2">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

/** Calm card used inside settings sections (lower intensity than marketing cards). */
export function SettingsCard({
  title,
  description,
  aside,
  children,
  tone = "default",
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border bg-card p-5 surface-highlight sm:p-6",
        tone === "danger" && "border-destructive/30 bg-destructive/[0.03]",
        className,
      )}
    >
      {(title || aside) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            {title && (
              <h3 className={cn("font-sans text-base font-semibold", tone === "danger" && "text-destructive")}>
                {title}
              </h3>
            )}
            {description && <p className="max-w-prose text-sm text-muted-foreground">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </div>
  );
}
