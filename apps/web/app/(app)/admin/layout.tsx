import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { getUser } from "@/lib/api";
import { AdminTabs } from "./admin-tabs";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  // 404, not 403: don't reveal that an admin area exists.
  if (user?.role !== "admin") notFound();
  const t = await getTranslations("admin");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <AdminTabs
        tabs={[
          { href: "/admin", label: t("users") },
          { href: "/admin/flags", label: t("flags") },
          { href: "/admin/health", label: t("health") },
        ]}
      />
      {children}
    </div>
  );
}
