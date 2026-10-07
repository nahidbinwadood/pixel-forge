import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "What cookies PixelForge uses and the choices you have.",
  openGraph: {
    title: "Cookie Policy · PixelForge",
    description: "What cookies PixelForge uses and the choices you have.",
  },
};

const KEYS = ["essential", "analytics", "yourChoices", "changes"] as const;

export default async function CookiesPage() {
  const [t, tl] = await Promise.all([getTranslations("site.legal.cookies"), getTranslations("site.legal")]);
  return (
    <LegalPage
      title={t("title")}
      updated={tl("updated")}
      intro={t("intro")}
      sections={KEYS.map((k) => ({ title: t(`sections.${k}.title`), body: t(`sections.${k}.body`) }))}
    />
  );
}
