import { prisma } from "@pixelforge/db";
import { FlagIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateFlagForm, FlagCard } from "./flag-forms";

export const dynamic = "force-dynamic";

export default async function AdminFlagsPage() {
  const [t, flags] = await Promise.all([
    getTranslations("admin"),
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {flags.length === 0 ? (
        <EmptyState icon={<FlagIcon />} title={t("noFlags")} description={t("noFlagsDesc")} />
      ) : (
        <ul className="grid gap-3">
          {flags.map((f) => (
            <li key={f.key}>
              <FlagCard
                flagKey={f.key}
                description={f.description}
                enabled={f.enabled}
                rules={f.rules ? JSON.stringify(f.rules, null, 2) : ""}
              />
            </li>
          ))}
        </ul>
      )}
      <section
        aria-labelledby="new-flag"
        className="flex flex-col gap-4 rounded-2xl border bg-card p-5 surface-highlight lg:sticky lg:top-24"
      >
        <div className="grid gap-1">
          <h2 id="new-flag" className="font-sans text-base font-semibold">
            {t("newFlag")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("newFlagDesc")}</p>
        </div>
        <CreateFlagForm />
      </section>
    </div>
  );
}
