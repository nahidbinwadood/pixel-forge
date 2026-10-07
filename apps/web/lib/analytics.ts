export const COOKIE_CONSENT_KEY = "pf-cookie-consent";

/** Cookie consent banner (components/(site)/_components/cookie-consent.tsx) writes this. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return true; // server-side calls (no banner to ask) aren't gated here
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

/**
 * Product analytics (PRD success metrics). Isomorphic. Sends to the PostHog capture API over fetch
 * when a key is set; otherwise logs in dev. Event names are snake_case and listed in docs/PRD.md.
 * Gated on cookie consent in the browser (SECURITY.md §8 / CLAUDE.md "Cookie consent banner").
 */
export function track(event: string, props: Record<string, unknown> = {}, distinctId = "anonymous") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || !hasAnalyticsConsent()) {
    if (process.env.NODE_ENV === "development") console.warn(`[track] ${event}`, props);
    return;
  }
  void fetch("https://us.i.posthog.com/capture/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, event, distinct_id: distinctId, properties: props }),
    keepalive: true,
  }).catch(() => {});
}
