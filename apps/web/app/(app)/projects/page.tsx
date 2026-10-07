import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/api";
import { listProjects } from "@/lib/projects";
import { DesignsClient } from "./designs-client";
import { NewDesignDialog } from "./new-design-dialog";

export const metadata: Metadata = { title: "My designs" };

/** Thin page: first page of designs on the server, interactions in the client grid. */
export default async function ProjectsPage() {
  const user = await requireUser();
  const [t, first] = await Promise.all([getTranslations("editor"), listProjects(user.id, { limit: 24 })]);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        title={t("designs.title")}
        description={t("designs.description")}
        action={<NewDesignDialog userId={user.id} />}
      />
      <DesignsClient initial={first.items} initialCursor={first.nextCursor} userId={user.id} />
    </div>
  );
}
