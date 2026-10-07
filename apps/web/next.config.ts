import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages ship TS source, no build step.
  transpilePackages: ["@pixelforge/shared", "@pixelforge/editor-core"],
  // Typecheck runs as its own step (`pnpm typecheck`) in CI.
  typescript: { ignoreBuildErrors: true },
};

export default config;
