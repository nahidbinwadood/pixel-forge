import { Skeleton } from "@/components/ui/skeleton";

/** My Designs skeleton: header, search, card grid. */
export default function ProjectsLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-3">
          <Skeleton className="h-10 w-56 rounded-lg" />
          <Skeleton className="h-5 w-80 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm rounded-full" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
          <div key={k} className="grid gap-2">
            <Skeleton className="aspect-[4/3] rounded-3xl" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
