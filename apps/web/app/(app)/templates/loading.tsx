import { Skeleton } from "@/components/ui/skeleton";

/** Matches TemplatesClient's shape: header, filter bar, masonry grid. */
export default function TemplatesLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="grid gap-3">
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-5 w-96 max-w-full rounded-md" />
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="flex gap-2">
        {["a", "b", "c", "d", "e"].map((k) => (
          <Skeleton key={k} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
        {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"].map((k, i) => (
          <Skeleton
            key={k}
            className="w-full rounded-2xl shimmer"
            style={{ aspectRatio: i % 3 === 0 ? "1/1" : "4/5" }}
          />
        ))}
      </div>
    </div>
  );
}
