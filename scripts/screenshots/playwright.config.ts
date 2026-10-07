import { defineConfig } from "@playwright/test";
import base from "../../playwright.config";

// Design-audit screenshots: `npx playwright test -c scripts/screenshots` → docs/design/screenshots/<label>/
export default defineConfig({
  ...base,
  testDir: ".",
  globalSetup: "../../e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 900_000,
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
