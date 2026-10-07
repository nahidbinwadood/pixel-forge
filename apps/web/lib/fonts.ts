import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

// Self-hosted at build time; CSS variables feed the @theme font tokens in globals.css.
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
export const clash = localFont({
  src: [
    { path: "../app/fonts/ClashDisplay-500.woff2", weight: "500" },
    { path: "../app/fonts/ClashDisplay-600.woff2", weight: "600" },
    { path: "../app/fonts/ClashDisplay-700.woff2", weight: "700" },
  ],
  variable: "--font-clash",
  display: "swap",
  fallback: ["Geist", "system-ui", "sans-serif"],
});
