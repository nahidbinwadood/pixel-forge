import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // `server-only` throws outside React Server Components; tests import server modules directly.
  resolve: {
    alias: { "server-only": fileURLToPath(new URL("./apps/web/node_modules/server-only/empty.js", import.meta.url)) },
  },
  test: {
    include: ["{apps,packages}/*/src/**/*.test.ts", "apps/web/{lib,app,emails}/**/*.test.ts"],
    coverage: { include: ["packages/*/src/**"], exclude: ["**/*.test.ts"] },
  },
});
