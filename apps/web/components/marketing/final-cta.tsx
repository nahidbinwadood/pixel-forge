import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuroraBackdrop } from "@/components/brand/aurora-backdrop";
import { Button } from "@/components/ui/button";
import { SectionItem, SectionStagger } from "./section-motion";

/** Closing call to action: big rounded panel on a soft aurora mesh. */
export async function FinalCta() {
  const t = await getTranslations("sections.cta");

  return (
    <section aria-labelledby="cta-title" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:pb-32">
      <div className="relative isolate overflow-hidden rounded-[2.5rem] border bg-card px-6 py-20 text-center surface-highlight sm:px-12 lg:py-28">
        <AuroraBackdrop className="opacity-80" />
        <SectionStagger className="mx-auto grid max-w-3xl justify-items-center gap-6">
          <SectionItem>
            <h2 id="cta-title" className="text-hero text-balance">
              {t("title")}
            </h2>
          </SectionItem>
          <SectionItem>
            <p className="text-lg text-text-2">{t("body")}</p>
          </SectionItem>
          <SectionItem className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">{t("start")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-surface-1/70 backdrop-blur">
              <Link href="/sign-in">{t("signIn")}</Link>
            </Button>
          </SectionItem>
        </SectionStagger>
      </div>
    </section>
  );
}
