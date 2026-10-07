import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton matching ToolShell: title row, controls card, result area, history rail. */
export function ToolSkeleton() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-44 rounded-full" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_17rem]">
        <Skeleton className="h-[28rem] rounded-2xl" />
        <Skeleton className="aspect-square rounded-2xl shimmer" />
        <div className="grid gap-2 lg:col-span-2 xl:col-span-1">
          {["a", "b", "c", "d"].map((k) => (
            <Skeleton key={k} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Loading skeleton for the hub and usage pages: header + tiles + list. */
export function HubSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-3">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-5 w-96 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-12 w-44 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["a", "b", "c"].map((k) => (
          <Skeleton key={k} className="h-56 rounded-3xl" />
        ))}
      </div>
      <div className="grid max-w-xl gap-2">
        {["a", "b", "c", "d"].map((k) => (
          <Skeleton key={k} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
