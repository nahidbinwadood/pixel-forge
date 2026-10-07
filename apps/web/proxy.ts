import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/home", "/uploads", "/settings", "/admin"];

/** Presigned URLs live on S3_ENDPOINT, public assets on PUBLIC_ASSET_BASE_URL; on R2 these are different hosts. */
function storageOrigins(): string[] {
  const origins = [process.env.S3_ENDPOINT, process.env.PUBLIC_ASSET_BASE_URL].flatMap((u) => {
    try {
      return u ? [new URL(u).origin] : [];
    } catch {
      return [];
    }
  });
  return [...new Set(origins)];
}

/** Per-request CSP with a nonce (SECURITY.md §3); Next auto-applies it to its own inline scripts. */
function cspHeader(): { csp: string; nonce: string } {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const extra = storageOrigins()
    .map((o) => ` ${o}`)
    .join("");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' blob: data: https://images.unsplash.com https://images.pexels.com${extra}`,
    `connect-src 'self' https://*.sentry.io https://us.i.posthog.com${extra}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
  return { csp, nonce };
}

/**
 * Next.js only allows one of middleware.ts/proxy.ts (16.x renamed the convention) — so the CSP
 * nonce (hardening pass, SECURITY.md §3) lives here alongside the pre-existing optimistic auth
 * redirect, instead of in a separate middleware.ts. Real authorization still happens in the
 * (app) layout and in every route handler via requireUser(); this is just a fast "cookie present?"
 * check so a signed-out visit to a protected path never round-trips to the server unauthenticated.
 */
export function proxy(req: NextRequest) {
  const { csp, nonce } = cspHeader();
  const needsAuth = PROTECTED.some((p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(`${p}/`));

  if (needsAuth && !getSessionCookie(req)) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    const res = NextResponse.redirect(url);
    res.headers.set("Content-Security-Policy", csp);
    return res;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // Every page/route handler except static assets, so the CSP applies broadly; `needsAuth` above
  // narrows the redirect itself back down to the original protected paths.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
