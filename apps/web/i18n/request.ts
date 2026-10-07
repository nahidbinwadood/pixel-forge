import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["en"] as const;
type Locale = (typeof LOCALES)[number];

/** One JSON file per namespace in messages/<locale>/ — add the name here when you add a file. */
const NAMESPACES = [
  "common",
  "landing",
  "sections",
  "auth",
  "nav",
  "home",
  "uploads",
  "settings",
  "admin",
  "paywall",
  "site",
  "billing",
] as const;

// No locale in the URL: locale comes from a cookie (set from user settings). RTL-ready via `dir` in the root layout.
export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get("locale")?.value;
  const locale: Locale = LOCALES.find((l) => l === fromCookie) ?? "en";
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, (await import(`../messages/${locale}/${ns}.json`)).default] as const),
  );
  return { locale, messages: Object.fromEntries(entries) };
});
