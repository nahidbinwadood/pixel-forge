import { APP_NAME } from "@pixelforge/shared";
import { EraserIcon, ImageIcon, LayoutTemplateIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/api";

export default async function Landing() {
  if (await getUser()) redirect("/home");
  const t = await getTranslations("landing");
  const tools = [
    { icon: ImageIcon, title: t("tools.editor"), desc: t("tools.editorDesc") },
    { icon: LayoutTemplateIcon, title: t("tools.design"), desc: t("tools.designDesc") },
    { icon: EraserIcon, title: t("tools.bgRemove"), desc: t("tools.bgRemoveDesc") },
    { icon: SparklesIcon, title: t("tools.aiImage"), desc: t("tools.aiImageDesc") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <span className="flex items-center gap-2 text-lg font-semibold">
          {/* biome-ignore lint/performance/noImgElement: static SVG logo */}
          <img src="/icon.svg" alt="" width={28} height={28} />
          {APP_NAME}
        </span>
        <Button asChild variant="ghost">
          <Link href="/sign-in">{t("ctaSignIn")}</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-16">
        <section className="flex max-w-3xl flex-col gap-6">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">{t("title")}</h1>
          <p className="max-w-xl text-lg text-muted-foreground">{t("subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">{t("ctaStart")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">{t("ctaSignIn")}</Link>
            </Button>
          </div>
        </section>

        <section aria-label="Tools" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}
