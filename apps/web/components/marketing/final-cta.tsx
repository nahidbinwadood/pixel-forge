import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuroraBackdrop } from "@/components/brand/aurora-backdrop";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export async function FinalCta() {
  const t = await getTranslations("landing.cta");
  return (
    <section className="px-3 py-10">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] border px-6 py-20 text-center sm:py-28">
        <AuroraBackdrop />
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-8">
          <h2 className="text-hero text-balance">{t("title")}</h2>
          <Button asChild size="lg">
            <Link href="/sign-up">{t("button")}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
