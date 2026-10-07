import { cn } from "cn";

/**
 * Slow-drifting aurora mesh. Only behind the hero and final CTA (AUDIT §3) — never behind working UI.
 * Pure CSS (GPU transform), static under reduced motion via the global media query.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute -inset-[20%] animate-aurora-drift bg-mesh opacity-70 dark:opacity-100" />
      <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,var(--background)_75%)]" />
    </div>
  );
}
