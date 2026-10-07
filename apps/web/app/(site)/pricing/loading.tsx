import { Skeleton } from "@/components/ui/skeleton";

/** Matches the plan-card grid shape so the layout doesn't jump once data arrives. */
export default function PricingLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="mx-auto grid max-w-2xl justify-items-center gap-3 text-center">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {["a", "b", "c", "d"].map((k) => (
          <Skeleton key={k} className="h-80 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
