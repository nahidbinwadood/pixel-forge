import { APP_NAME } from "@pixelforge/shared";

// Phase 0 placeholder. Real home (hero, tool grid, templates) lands in Phase 1.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-muted">
        From idea to publish-ready visual in minutes. Scaffold is up; features start in Phase 1.
      </p>
      <span className="rounded-ui bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink">Phase 0</span>
    </main>
  );
}
