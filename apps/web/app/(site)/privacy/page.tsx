import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What PixelForge collects, why, and the choices you have.",
  openGraph: { title: "Privacy Policy · PixelForge", description: "What PixelForge collects, why, and the choices you have." },
};

const KEYS = [
  "dataWeCollect",
  "howWeUseIt",
  "aiProcessing",
  "sharing",
  "retention",
  "yourRights",
  "cookies",
  "children",
] as const;

export default async function PrivacyPage() {
  const [t, tl] = await Promise.all([getTranslations("site.legal.privacy"), getTranslations("site.legal")]);
  return (
    <LegalPage
      title={t("title")}
      updated={tl("updated")}
      intro={t("intro")}
      sections={KEYS.map((k) => ({ title: t(`sections.${k}.title`), body: t(`sections.${k}.body`) }))}
    />
  );
}
