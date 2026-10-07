import type { ReactNode } from "react";

export function Section({
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
    <section id={id} aria-labelledby={`${id}-h`} className="flex scroll-mt-32 flex-col gap-6">
      <header className="grid gap-1.5 border-b pb-4">
        <h2 id={`${id}-h`} className="text-h2">
          {title}
        </h2>
        <p className="max-w-2xl text-text-2">{description}</p>
      </header>
      {children}
    </section>
  );
}

/** Labeled specimen block inside a section. */
export function Specimen({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-sans text-xs font-medium text-muted-foreground">{label}</h3>
      <div className={className ?? "flex flex-wrap items-center gap-3"}>{children}</div>
    </div>
  );
}
