/**
 * Canvas chrome colors come from the design tokens in globals.css (Konva draws to <canvas>, so it can't
 * use Tailwind classes). Read at draw time so they follow the light/dark theme.
 */
export function themeColor(name: "--primary" | "--muted-foreground" | "--destructive" | "--border" | "--surface-3") {
  if (typeof document === "undefined") return "transparent";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "transparent";
}
