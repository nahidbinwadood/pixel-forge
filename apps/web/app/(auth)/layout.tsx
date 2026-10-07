import { APP_NAME } from "@pixelforge/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getUser } from "@/lib/api";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getUser()) redirect("/home");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        {/* biome-ignore lint/performance/noImgElement: static SVG logo */}
        <img src="/icon.svg" alt="" width={28} height={28} />
        {APP_NAME}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
