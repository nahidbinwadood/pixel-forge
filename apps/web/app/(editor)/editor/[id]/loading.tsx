import { Skeleton } from "@/components/ui/skeleton";

/** Editor skeleton: top bar, left rail, canvas, properties panel. */
export default function EditorLoading() {
  return (
    <div className="flex h-dvh flex-col bg-background" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading editor…</span>
      <div className="flex h-14 items-center gap-3 border-b bg-surface-1 px-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="mx-auto h-8 w-64 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[4.5rem] flex-col items-center gap-3 border-e bg-surface-1 py-3">
          {["a", "b", "c", "d", "e"].map((k) => (
            <Skeleton key={k} className="size-12 rounded-2xl" />
          ))}
        </div>
        <div className="grid flex-1 place-items-center bg-surface-3/60">
          <Skeleton className="aspect-square w-[min(60vh,50vw)] rounded-sm shimmer" />
        </div>
        <div className="hidden w-76 border-s bg-surface-1 lg:block" />
      </div>
    </div>
  );
}
