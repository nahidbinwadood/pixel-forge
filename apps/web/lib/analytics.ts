/**
 * Product analytics (PRD success metrics). Isomorphic. Sends to the PostHog capture API over fetch
 * when a key is set; otherwise logs in dev. Event names are snake_case and listed in docs/PRD.md.
 */
export function track(event: string, props: Record<string, unknown> = {}, distinctId = "anonymous") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
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
