import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LightSweep } from "@/components/brand/light-sweep";
import { Logo } from "@/components/brand/logo";
import { getUser } from "@/lib/api";

const PRESETS = [{ id: "film", label: "Film", src: "/hero/beach-film.webp" }] as const;

/** Split auth layout: form on the left; on lg+ the brand moment (the light sweep) on the right. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const [user, t] = await Promise.all([getUser(), getTranslations("auth.showcase")]);
  if (user) redirect("/home");

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
        <Logo />
        <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {children}
        </main>
      </div>

      <aside className="relative hidden overflow-hidden border-s bg-surface-1 p-10 lg:flex lg:flex-col lg:justify-center lg:gap-10 xl:p-16">
        <div className="relative grid max-w-md gap-3">
          <p className="font-display text-h2 font-semibold">{t("title")}</p>
          <p className="text-text-2">{t("body")}</p>
        </div>
        <LightSweep
          original="/hero/beach-original.webp"
          presets={PRESETS}
          alt={t("alt")}
          showChips={false}
          sizes="(min-width: 1024px) 45vw, 0px"
          className="relative"
        />
      </aside>
    </div>
  );
}
