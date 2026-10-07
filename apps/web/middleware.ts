import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Per-request CSP with a nonce (SECURITY.md §3). Next.js auto-applies a nonce it finds in the
 * response's CSP header to its own inline bootstrap scripts, so no change is needed in layout.tsx.
 * Everything else (HSTS, X-Frame-Options, …) is static and lives in next.config.ts instead.
 */
function storageOrigin(): string | undefined {
  try {
    return new URL(process.env.PUBLIC_ASSET_BASE_URL ?? process.env.S3_ENDPOINT ?? "").origin;
  } catch {
    return undefined;
  }
}

export function middleware(req: NextRequest): NextResponse {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const storage = storageOrigin();
  const extraImg = storage ? ` ${storage}` : "";
  const extraConnect = storage ? ` ${storage}` : "";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' blob: data: https://images.unsplash.com https://images.pexels.com${extraImg}`,
    `connect-src 'self' https://*.sentry.io https://us.i.posthog.com${extraConnect}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals; everything else (pages + route handlers) gets a CSP.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)",
  ],
};
