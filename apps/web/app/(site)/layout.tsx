import type { ReactNode } from "react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";

/**
 * Public marketing/legal/SEO pages (pricing, legal, about, contact, /tools/*). Unlike the landing
 * page at "/", these stay reachable while signed in (e.g. upgrading from Settings → Pricing).
 * CookieConsent mounts once in the root layout (app/layout.tsx) so it also gates analytics on the
 * authenticated app and auth pages, not just here.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <SiteNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
