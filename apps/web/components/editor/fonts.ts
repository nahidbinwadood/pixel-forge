/**
 * Fonts available in the editor. App fonts are self-hosted by next/font, so the canvas resolves their real
 * family names from the CSS variables at runtime; the others are common system faces with fallbacks.
 * The full font library (Google Fonts + uploads) arrives with the content libraries (Phase 3).
 */
export const FONT_OPTIONS = [
  { value: "Geist", label: "Geist", cssVar: "--font-geist", fallback: "system-ui, sans-serif" },
  {
    value: "Bricolage Grotesque",
    label: "Bricolage",
    cssVar: "--font-display-face",
    fallback: "system-ui, sans-serif",
  },
  { value: "Geist Mono", label: "Geist Mono", cssVar: "--font-geist-mono", fallback: "ui-monospace, monospace" },
  { value: "Georgia", label: "Georgia", cssVar: null, fallback: "Georgia, serif" },
  { value: "Arial", label: "Arial", cssVar: null, fallback: "Arial, Helvetica, sans-serif" },
  { value: "Courier New", label: "Courier New", cssVar: null, fallback: "'Courier New', monospace" },
] as const;

const cache = new Map<string, string>();

/** CSS font-family string for a document font name (unknown names fall back to Geist). */
export function cssFontFamily(name: string): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const opt = FONT_OPTIONS.find((f) => f.value === name) ?? FONT_OPTIONS[0];
  const fromVar =
    opt.cssVar && typeof document !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue(opt.cssVar).trim()
      : "";
  const family = fromVar ? `${fromVar}, ${opt.fallback}` : opt.fallback;
  if (fromVar || !opt.cssVar) cache.set(name, family);
  return family;
}
