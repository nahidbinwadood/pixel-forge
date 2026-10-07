import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, bug reports or partnership ideas — reach the PixelForge team.",
  openGraph: { title: "Contact · PixelForge", description: "Questions, bug reports or partnership ideas." },
};

export default async function ContactPage() {
  const t = await getTranslations("site.contact");
  const fromAddress = (process.env.EMAIL_FROM ?? "").match(/<([^>]+)>/)?.[1] ?? process.env.EMAIL_FROM;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <h1 className="text-display">{t("title")}</h1>
        <p className="mt-4 text-lg text-text-2">{t("subtitle")}</p>
      </Reveal>
      <Reveal delay={0.05} className="mt-10">
        <ContactForm />
      </Reveal>
      {fromAddress && <p className="mt-8 text-sm text-muted-foreground">{t("directEmail", { email: fromAddress })}</p>}
    </div>
  );
}
