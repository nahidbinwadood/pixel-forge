import { prisma } from "@pixelforge/db";
import { LayoutTemplateIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateTemplateForm } from "./template-admin-forms";
import { TemplateAdminList } from "./template-admin-list";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const [t, templates, categories] = await Promise.all([
    getTranslations("templates.admin"),
    prisma.template.findMany({
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.templateCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      {templates.length === 0 ? (
        <EmptyState icon={<LayoutTemplateIcon />} title={t("noTemplates")} description={t("noTemplatesDesc")} />
      ) : (
        <TemplateAdminList
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          templates={templates.map((row) => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            description: row.description,
            categorySlug: row.category.slug,
            categoryName: row.category.name,
            sizePreset: row.sizePreset,
            style: row.style,
            colors: row.colors,
            tags: row.tags,
            premium: row.premium,
            published: row.publishedAt !== null,
            useCount: row.useCount,
            updatedAt: row.updatedAt.toISOString(),
            documentJson: JSON.stringify(row.document, null, 2),
          }))}
        />
      )}
      <section
        aria-labelledby="new-template"
        className="flex flex-col gap-4 rounded-2xl border bg-card p-5 surface-highlight lg:sticky lg:top-24"
      >
        <h2 id="new-template" className="font-sans text-base font-semibold">
          {t("newTemplate")}
        </h2>
        <CreateTemplateForm categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      </section>
    </div>
  );
}
