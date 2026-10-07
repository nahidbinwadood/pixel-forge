import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";

/** Legal/company pages don't exist yet: listed as plain text (no dead links) with a note. */
export async function SiteFooter() {
  const [t, nav] = await Promise.all([getTranslations("landing.footer"), getTranslations("landing.nav")]);
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto max-w-7xl px-4 pt-10 pb-12 sm:px-6">
      <div className="grid gap-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
        </div>
        <nav aria-label={t("product")} className="grid content-start gap-2 text-sm">
          <h2 className="font-sans text-sm font-semibold">{t("product")}</h2>
          <a href="#tools" className="text-text-2 hover:text-foreground">
            {nav("tools")}
          </a>
          <a href="#how" className="text-text-2 hover:text-foreground">
            {nav("how")}
          </a>
          <a href="#faq" className="text-text-2 hover:text-foreground">
            {nav("faq")}
          </a>
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <h2 className="font-sans text-sm font-semibold">{t("company")}</h2>
          <span className="text-muted-foreground">{t("about")}</span>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <h2 className="font-sans text-sm font-semibold">{t("legal")}</h2>
          <span className="text-muted-foreground">{t("terms")}</span>
          <span className="text-muted-foreground">{t("privacy")}</span>
          <span className="text-muted-foreground">{t("contentPolicy")}</span>
          <span className="text-xs text-muted-foreground">{t("comingSoon")}</span>
        </div>
      </div>
      <p className="mt-10 text-sm text-muted-foreground">{t("rights", { year })}</p>
    </footer>
  );
}
