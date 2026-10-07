import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppRail } from "@/components/shell/app-rail";
import { MobileNav } from "@/components/shell/mobile-nav";
import { TopBar } from "@/components/shell/top-bar";
import { creditBalance, userPlan } from "@/lib/account";
import { getUser } from "@/lib/api";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const [credits, plan, t] = await Promise.all([creditBalance(user.id), userPlan(user.id), getTranslations("nav")]);
  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow-float"
      >
        {t("skip")}
      </a>
      <AppRail isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={{ name: user.name, email: user.email, image: user.image ?? null }}
          isAdmin={isAdmin}
          credits={credits}
          allowance={plan.monthlyCredits}
        />
        <main id="main" className="flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-12">
          {children}
        </main>
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
