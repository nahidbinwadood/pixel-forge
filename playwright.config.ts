import { defineConfig, devices } from "@playwright/test";

// PORT lets parallel worktrees run their own app + E2E side by side.
const PORT = process.env.PORT ?? "3000";
const BASE = `http://localhost:${PORT}`;

// Needs local infra: `pnpm db:up && pnpm db:migrate`. Starts web + worker itself.
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: BASE, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @pixelforge/web dev", // next dev honours the PORT env var
      url: `${BASE}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @pixelforge/worker start",
      // ponytail: worker has no HTTP port; Playwright just keeps it alive for the run.
      wait: { stderr: /\[worker\] listening/ },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
