import { Skeleton } from "@/components/ui/skeleton";

/** Segment skeleton: header + a hero block + a tile grid, matching the shape of Home/Uploads. */
export default function AppLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="grid gap-3">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-5 w-96 max-w-full rounded-md" />
      </div>
      <Skeleton className="h-56 rounded-3xl shimmer" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
          <Skeleton key={k} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
