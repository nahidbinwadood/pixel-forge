import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["en"] as const;
type Locale = (typeof LOCALES)[number];

// No locale in the URL: locale comes from a cookie (set from user settings). RTL-ready via `dir` in the root layout.
export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get("locale")?.value;
  const locale: Locale = LOCALES.find((l) => l === fromCookie) ?? "en";
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
