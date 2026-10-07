import type { NextConfig } from "next";

// Security headers (SECURITY.md §3). CSP itself is set per-request in proxy.ts (it needs a
// fresh nonce per request); everything else is static and belongs here.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS only matters over HTTPS; browsers ignore it on plain http (local dev), so it's safe to always send.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const config: NextConfig = {
  // Workspace packages ship TS source, no build step.
  transpilePackages: ["@pixelforge/shared", "@pixelforge/editor-core", "@pixelforge/db", "@pixelforge/ai"],
  // Typecheck runs as its own step (`pnpm typecheck`) in CI.
  typescript: { ignoreBuildErrors: true },
  // Native/wasm deps used by background jobs (lib/jobs) stay out of the bundle.
  serverExternalPackages: ["sharp", "heic-convert", "@google/genai"],
  devIndicators: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  // ponytail: this alias is all `next-intl/plugin` does for us. The plugin itself loads @swc/core's native
  // addon at config time, which is fragile on some Windows setups. Use the plugin again if we need its
  // message extraction/precompile features.
  turbopack: { resolveAlias: { "next-intl/config": "./i18n/request.ts" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
