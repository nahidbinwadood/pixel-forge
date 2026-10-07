import { prisma } from "@pixelforge/db";
import { getTranslations } from "next-intl/server";
import { CreateFlagForm, FlagRow } from "./flag-forms";

export const dynamic = "force-dynamic";

export default async function AdminFlagsPage() {
  const [t, flags] = await Promise.all([
    getTranslations("admin"),
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y rounded-lg border">
        {flags.map((f) => (
          <li key={f.key}>
            <FlagRow
              flagKey={f.key}
              description={f.description}
              enabled={f.enabled}
              rules={f.rules ? JSON.stringify(f.rules, null, 2) : ""}
            />
          </li>
        ))}
        {flags.length === 0 && <li className="p-6 text-center text-muted-foreground">No flags yet.</li>}
      </ul>
      <section aria-labelledby="new-flag" className="flex flex-col gap-3">
        <h2 id="new-flag" className="text-lg font-medium">
          New flag
        </h2>
        <CreateFlagForm keyLabel={t("flagKey")} />
      </section>
    </div>
  );
}
