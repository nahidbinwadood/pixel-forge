import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "DMCA & Copyright Policy",
  description: "How PixelForge handles copyright takedown notices.",
  openGraph: { title: "DMCA & Copyright Policy · PixelForge", description: "How PixelForge handles copyright takedown notices." },
};

const KEYS = ["policy", "filingNotice", "counterNotice", "repeatInfringers"] as const;

export default async function DmcaPage() {
  const [t, tl] = await Promise.all([getTranslations("site.legal.dmca"), getTranslations("site.legal")]);
  return (
    <LegalPage
      title={t("title")}
      updated={tl("updated")}
      intro={t("intro")}
      sections={KEYS.map((k) => ({ title: t(`sections.${k}.title`), body: t(`sections.${k}.body`) }))}
    />
  );
}
