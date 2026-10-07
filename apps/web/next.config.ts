import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages ship TS source, no build step.
  transpilePackages: ["@pixelforge/shared", "@pixelforge/editor-core", "@pixelforge/db", "@pixelforge/ai"],
  // Typecheck runs as its own step (`pnpm typecheck`) in CI.
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["bullmq", "ioredis", "@google/genai"],
  devIndicators: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  // ponytail: this alias is all `next-intl/plugin` does for us. The plugin itself loads @swc/core's native
  // addon at config time, which is fragile on some Windows setups. Use the plugin again if we need its
  // message extraction/precompile features.
  turbopack: { resolveAlias: { "next-intl/config": "./i18n/request.ts" } },
};

export default config;
