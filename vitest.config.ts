import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["{apps,packages}/*/src/**/*.test.ts", "apps/web/{lib,app}/**/*.test.ts"],
    coverage: { include: ["packages/*/src/**"], exclude: ["**/*.test.ts"] },
  },
});
