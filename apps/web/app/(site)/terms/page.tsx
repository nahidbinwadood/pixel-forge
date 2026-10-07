import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that cover your use of PixelForge.",
  openGraph: { title: "Terms of Service · PixelForge", description: "The terms that cover your use of PixelForge." },
};

const KEYS = [
  "accounts",
  "acceptableUse",
  "yourContent",
  "aiFeatures",
  "paidPlans",
  "availability",
  "termination",
  "disclaimer",
  "changes",
] as const;

export default async function TermsPage() {
  const [t, tl] = await Promise.all([getTranslations("site.legal.terms"), getTranslations("site.legal")]);
  return (
    <LegalPage
      title={t("title")}
      updated={tl("updated")}
      intro={t("intro")}
      sections={KEYS.map((k) => ({ title: t(`sections.${k}.title`), body: t(`sections.${k}.body`) }))}
    />
  );
}
