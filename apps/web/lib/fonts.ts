import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

// Self-hosted at build time; CSS variables feed the @theme font tokens in globals.css.
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
/** Display face: tight, heavy grotesque with optical sizing (opsz axis) for big headlines. */
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap",
  axes: ["opsz", "wdth"],
});
