"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setTemplatePublished } from "@/lib/admin-templates";
import { EditTemplateSheet } from "./template-admin-forms";
import type { TemplateAdminRow, TemplateCategoryOption } from "./types";

export function TemplateAdminList({
  templates,
  categories,
}: {
  templates: TemplateAdminRow[];
  categories: TemplateCategoryOption[];
}) {
  const t = useTranslations("templates.admin");
  const [editing, setEditing] = useState<TemplateAdminRow | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("titleField")}</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("useCount")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TemplateRow key={template.id} template={template} onEdit={() => setEditing(template)} />
          ))}
        </TableBody>
      </Table>
      <EditTemplateSheet
        template={editing}
        categories={categories}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </>
  );
}

function TemplateRow({ template, onEdit }: { template: TemplateAdminRow; onEdit: () => void }) {
  const t = useTranslations("templates.admin");
  const [pending, start] = useTransition();

  return (
    <TableRow>
      <TableCell className="max-w-56 truncate font-medium">{template.title}</TableCell>
      <TableCell className="text-muted-foreground">{template.categoryName}</TableCell>
      <TableCell>
        <Badge variant={template.published ? "success" : "outline"}>
          {template.published ? t("published") : t("draft")}
        </Badge>
        {template.premium && (
          <Badge variant="premium" className="ml-1.5">
            Premium
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{template.useCount}</TableCell>
      <TableCell className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          {t("edit")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await setTemplatePublished(template.id, !template.published);
              if (r.ok) toast.success(template.published ? t("unpublishedToast") : t("publishedToast"));
              else toast.error(r.error);
            })
          }
        >
          {template.published ? t("unpublish") : t("publish")}
        </Button>
      </TableCell>
    </TableRow>
  );
}
