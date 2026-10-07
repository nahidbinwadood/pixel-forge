import { redirect } from "next/navigation";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Showcase } from "@/components/marketing/showcase";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { ToolBento } from "@/components/marketing/tool-bento";
import { getUser } from "@/lib/api";

/** Marketing landing. Thin server page composing section components (CLAUDE.md "Next.js + React patterns"). */
export default async function Landing() {
  if (await getUser()) redirect("/home");
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <SiteNav />
      <main id="main">
        <Hero />
        <ToolBento />
        <HowItWorks />
        <Showcase />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
