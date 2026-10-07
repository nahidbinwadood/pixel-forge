"use client";

import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { COOKIE_CONSENT_KEY } from "@/lib/analytics";
import { spring } from "@/lib/motion";

type Consent = "unset" | "granted" | "denied";

function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : "unset";
  } catch {
    return "unset";
  }
}

/**
 * Essential-only by default; analytics (PostHog, via lib/analytics.ts track()) only fires after
 * "Accept". Stored in localStorage per browser (SECURITY.md §8) — mounted once in the root layout
 * so it gates analytics on every route group, not just the public site.
 */
export function CookieConsent() {
  const t = useTranslations("site.cookies");
  const [consent, setConsent] = useState<Consent>("unset");

  useEffect(() => {
    setConsent(readConsent());
  }, []);

  function choose(value: "granted" | "denied") {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {
      // Private browsing / blocked storage: the choice just won't persist across reloads.
    }
    setConsent(value);
  }

  return (
    <AnimatePresence>
      {consent === "unset" && (
        <m.div
          role="region"
          aria-label={t("bannerLabel")}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={spring.soft}
          className="glass fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border p-4 shadow-float sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-text-2">
            {t("body")}{" "}
            <a href="/cookies" className="text-foreground underline underline-offset-4">
              {t("learnMore")}
            </a>
          </p>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => choose("denied")}>
              {t("essentialOnly")}
            </Button>
            <Button size="sm" onClick={() => choose("granted")}>
              {t("accept")}
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
