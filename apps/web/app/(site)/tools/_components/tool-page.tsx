import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SectionStatus } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/api";

/** Shared shell for the SEO /tools/* pages: honest status badge, benefits, one CTA. */
export async function ToolPage({ namespace, benefitKeys }: { namespace: string; benefitKeys: readonly string[] }) {
  const [t, tt, user] = await Promise.all([
    getTranslations(namespace),
    getTranslations("site.tools"),
    getUser(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="grid gap-5">
        <SectionStatus live>{tt("status")}</SectionStatus>
        <h1 className="text-display">{t("title")}</h1>
        <p className="text-lg text-text-2">{t("tagline")}</p>
        <p className="text-pretty text-text-2">{t("description")}</p>
      </Reveal>

      <Reveal delay={0.05} className="mt-10 grid gap-3">
        {benefitKeys.map((key) => (
          <div key={key} className="flex items-start gap-3">
            <CheckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-text-2">{t(`benefits.${key}`)}</p>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <Button asChild size="lg">
          <Link href={user ? "/home" : "/sign-up"}>{user ? tt("ctaSignedIn") : tt("cta")}</Link>
        </Button>
      </Reveal>
    </div>
  );
}
