import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "AI Usage Policy",
  description: "What powers PixelForge's AI tools, and what's off-limits.",
  openGraph: {
    title: "AI Usage Policy · PixelForge",
    description: "What powers PixelForge's AI tools, and what's off-limits.",
  },
};

const KEYS = ["providers", "acceptableUse", "prohibitedContent", "moderation", "ownership", "limitations"] as const;

export default async function AiPolicyPage() {
  const [t, tl] = await Promise.all([getTranslations("site.legal.aiPolicy"), getTranslations("site.legal")]);
  return (
    <LegalPage
      title={t("title")}
      updated={tl("updated")}
      intro={t("intro")}
      sections={KEYS.map((k) => ({ title: t(`sections.${k}.title`), body: t(`sections.${k}.body`) }))}
    />
  );
}
