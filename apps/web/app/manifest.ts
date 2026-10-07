import { APP_NAME } from "@pixelforge/shared";
import type { MetadataRoute } from "next";

// Installable PWA. ponytail: no service worker yet (not required for install in Chromium);
// add one with offline caching alongside editor offline mode (PRD US3.5).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Edit photos, design graphics and create with AI.",
    start_url: "/home",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#e8542b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
