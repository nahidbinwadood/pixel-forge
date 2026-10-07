/** Canvas size presets (PRD US3.1). Pixel sizes follow each platform's recommended upload size. */
export interface SizePreset {
  id: string;
  label: string;
  group: "social" | "video" | "print";
  width: number;
  height: number;
}

export const SIZE_PRESETS: readonly SizePreset[] = [
  { id: "instagram-post", label: "Instagram post", group: "social", width: 1080, height: 1080 },
  { id: "instagram-portrait", label: "Instagram portrait", group: "social", width: 1080, height: 1350 },
  { id: "instagram-story", label: "Instagram story", group: "social", width: 1080, height: 1920 },
  { id: "facebook-post", label: "Facebook post", group: "social", width: 1200, height: 630 },
  { id: "linkedin-post", label: "LinkedIn post", group: "social", width: 1200, height: 627 },
  { id: "x-post", label: "X post", group: "social", width: 1600, height: 900 },
  { id: "pinterest-pin", label: "Pinterest pin", group: "social", width: 1000, height: 1500 },
  { id: "youtube-thumbnail", label: "YouTube thumbnail", group: "video", width: 1280, height: 720 },
  { id: "tiktok-video", label: "TikTok cover", group: "video", width: 1080, height: 1920 },
  { id: "a4", label: "A4 (300 dpi)", group: "print", width: 2480, height: 3508 },
  { id: "poster", label: "Poster 18×24 in (150 dpi)", group: "print", width: 2700, height: 3600 },
];

/** Custom canvas bounds. The upper bound matches Page.width/height in the document schema. */
export const CUSTOM_SIZE = { min: 16, max: 8192 } as const;

export function findPreset(id: string): SizePreset | undefined {
  return SIZE_PRESETS.find((p) => p.id === id);
}

/** Human ratio label, e.g. 1080×1350 → "4:5". */
export function ratioLabel(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  const w = width / d;
  const h = height / d;
  return w > 50 || h > 50 ? `${(width / height).toFixed(2)}:1` : `${w}:${h}`;
}
