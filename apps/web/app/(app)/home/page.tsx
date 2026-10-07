import { LayoutTemplateIcon, PlusIcon, SparklesIcon, UploadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getUser } from "@/lib/api";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const [user, t] = await Promise.all([getUser(), getTranslations()]);
  // ponytail: only "Upload a photo" is live in Phase 1; the others light up as their phases land.
  const ctas = [
    { label: t("home.startScratch"), icon: PlusIcon, href: null },
    { label: t("home.uploadPhoto"), icon: UploadIcon, href: "/uploads" },
    { label: t("home.pickTemplate"), icon: LayoutTemplateIcon, href: null },
    { label: t("home.tryAi"), icon: SparklesIcon, href: null },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("home.greeting", { name: user?.name.split(" ")[0] ?? "" })}
      </h1>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ctas.map(({ label, icon: Icon, href }) => {
          const inner = (
            <>
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="font-medium">{label}</span>
              {!href && <span className="text-xs text-muted-foreground">{t("common.comingSoon")}</span>}
            </>
          );
          const cls = "flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left";
          return href ? (
            <Link key={label} href={href} className={`${cls} transition-colors hover:border-primary`}>
              {inner}
            </Link>
          ) : (
            <div key={label} aria-disabled="true" className={`${cls} opacity-60`}>
              {inner}
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("home.recent")}</h2>
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t("home.recentEmpty")}
        </div>
      </section>
    </div>
  );
}
