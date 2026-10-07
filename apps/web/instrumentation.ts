/**
 * Error reporting (SECURITY.md §9, A09). Dependency-free by design, matching this repo's style of
 * raw fetch over an SDK for optional integrations (lib/analytics.ts → PostHog, lib/email.ts used to
 * do this for Resend): `@sentry/nextjs` adds a build-time source-map-upload plugin that needs its own
 * auth token, which would make `pnpm build` fragile when nobody has configured a Sentry project yet.
 * Swap this for the real SDK once SENTRY_DSN is a real, owned project.
 */
export async function register(): Promise<void> {}

interface RequestInfo {
  path: string;
  method: string;
}

/** Next.js server-error hook (App Router): called for any uncaught error in a server context. */
export function onRequestError(error: unknown, request: RequestInfo): void {
  console.error(`[request-error] ${request.method} ${request.path}`, error);
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  void reportToSentry(dsn, error, request).catch(() => {});
}

async function reportToSentry(dsn: string, error: unknown, request: RequestInfo): Promise<void> {
  const match = /^https:\/\/([^@]+)@([^/]+)\/(\d+)$/.exec(dsn);
  if (!match) return;
  const [, publicKey, host, projectId] = match;
  const message = error instanceof Error ? error.message : String(error);
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: "error" as const,
    message,
    exception: error instanceof Error ? { values: [{ type: error.name, value: error.message }] } : undefined,
    request: { url: request.path, method: request.method },
  };
  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  await fetch(`https://${host}/api/${projectId}/envelope/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=pixelforge-minimal/1.0`,
    },
    body: envelope,
  });
}
