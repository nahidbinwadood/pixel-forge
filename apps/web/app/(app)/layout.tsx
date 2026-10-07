import { APP_NAME } from "@pixelforge/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/user-menu";
import { creditBalance } from "@/lib/account";
import { getUser } from "@/lib/api";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const [credits, t] = await Promise.all([creditBalance(user.id), getTranslations()]);
  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        {t("nav.skip")}
      </a>
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 md:flex">
        <Link href="/home" className="flex items-center gap-2 px-2 font-semibold">
          {/* biome-ignore lint/performance/noImgElement: static SVG logo */}
          <img src="/icon.svg" alt="" width={24} height={24} />
          {APP_NAME}
        </Link>
        <AppNav isAdmin={isAdmin} variant="sidebar" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-3 border-b px-4">
          <Link href="/home" className="mr-auto flex items-center gap-2 font-semibold md:hidden">
            {/* biome-ignore lint/performance/noImgElement: static SVG logo */}
            <img src="/icon.svg" alt="" width={24} height={24} />
            {APP_NAME}
          </Link>
          <Badge variant="secondary" aria-live="polite">
            {t("common.credits", { count: credits })}
          </Badge>
          <UserMenu name={user.name} email={user.email} image={user.image ?? null} isAdmin={isAdmin} />
        </header>
        <main id="main" className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">
          {children}
        </main>
      </div>
      <AppNav isAdmin={isAdmin} variant="bottom" />
    </div>
  );
}
