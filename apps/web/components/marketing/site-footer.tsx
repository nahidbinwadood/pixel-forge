import { APP_NAME } from "@pixelforge/shared";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "./hero-theme-toggle";

/** Footer: brand + columns + giant wordmark. */
export async function SiteFooter() {
  const [t, nav] = await Promise.all([getTranslations("landing.footer"), getTranslations("landing.nav")]);
  const year = new Date().getFullYear();
  const link = (href: string, label: string) => (
    <Link href={href} className="text-text-2 transition-colors hover:text-foreground">
      {label}
    </Link>
  );

  return (
    <footer className="relative mt-10 overflow-hidden border-t bg-surface-1">
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Logo />
            <p className="max-w-xs text-sm text-text-2">{t("tagline")}</p>
          </div>
          <nav aria-label={t("product")} className="grid content-start gap-3 text-sm lg:col-span-2">
            <h2 className="font-sans text-sm font-semibold">{t("product")}</h2>
            {(
              [
                ["#tools", "tools"],
                ["#looks", "looks"],
                ["#how", "how"],
                ["#faq", "faq"],
              ] as const
            ).map(([href, key]) => (
              <a key={href} href={href} className="text-text-2 transition-colors hover:text-foreground">
                {nav(key)}
              </a>
            ))}
            {link("/pricing", t("pricing"))}
          </nav>
          <div className="grid content-start gap-3 text-sm lg:col-span-2">
            <h2 className="font-sans text-sm font-semibold">{t("company")}</h2>
            {link("/about", t("about"))}
            {link("/contact", t("contact"))}
          </div>
          <div className="grid content-start gap-3 text-sm lg:col-span-3">
            <h2 className="font-sans text-sm font-semibold">{t("legal")}</h2>
            {link("/terms", t("terms"))}
            {link("/privacy", t("privacy"))}
            {link("/cookies", t("cookiesPolicy"))}
            {link("/dmca", t("dmca"))}
            {link("/ai-policy", t("aiPolicy"))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t py-6 text-sm text-muted-foreground">
          <p>{t("rights", { year })}</p>
          <ThemeToggle label={t("theme")} />
        </div>
      </div>

      <p
        aria-hidden
        className="pointer-events-none -mb-[0.22em] text-center font-display text-[clamp(4rem,19vw,17rem)] leading-none font-extrabold tracking-[-0.06em] text-transparent select-none [background:linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_9%,transparent),transparent_85%)] [background-clip:text]"
      >
        {APP_NAME}
      </p>
    </footer>
  );
}
