import { prisma } from "@pixelforge/db";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { personalWorkspaceId, userPlan } from "@/lib/account";
import { requireUser } from "@/lib/api";
import { recentProjects } from "@/lib/projects";
import { presignGet } from "@/lib/storage";
import { Library, type LibraryItem } from "./library";
import { QuickActions } from "./quick-actions";
import { RecentDesigns } from "./recent-designs";

export const metadata: Metadata = { title: "Home" };

async function recentUploads(userId: string): Promise<LibraryItem[]> {
  const workspaceId = await personalWorkspaceId(userId);
  const rows = await prisma.asset.findMany({
    where: { workspaceId, kind: "upload", status: { in: ["processing", "ready"] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 8,
    select: { id: true, status: true, variants: true, license: true },
  });
  return Promise.all(
    rows.map(async (a) => {
      const thumb = (a.variants as { thumb?: string }).thumb;
      return {
        id: a.id,
        processing: a.status === "processing",
        name: (a.license as { filename?: string } | null)?.filename ?? "",
        thumbUrl: thumb ? await presignGet(thumb) : null,
      };
    }),
  );
}

/** Thin page: parallel data, then composition. Only working actions are offered (AUDIT §5). */
export default async function HomePage() {
  const user = await requireUser();
  const [t, plan, items, designs] = await Promise.all([
    getTranslations("home"),
    userPlan(user.id),
    recentUploads(user.id),
    recentProjects(user.id),
  ]);
  const firstName = user.name.split(" ")[0] ?? "";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 md:gap-14">
      <h1 className="text-h1 max-w-3xl">
        {t("greeting", { name: firstName })} <span className="text-text-2">{t("greetingSub")}</span>
      </h1>

      <section className="grid gap-6 lg:grid-cols-12">
        <QuickActions maxMb={plan.maxUploadMb} userId={user.id} className="lg:col-span-5" />
        <RecentDesigns designs={designs} userId={user.id} className="lg:col-span-7" />
      </section>

      <Library items={items} />
    </div>
  );
}
