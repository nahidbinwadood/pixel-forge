"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormSubmit } from "@/components/form/form-submit";
import { FormSwitch } from "@/components/form/form-switch";
import { FormTextarea } from "@/components/form/form-textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createTemplate, getProjectDocument, updateTemplate } from "@/lib/admin-templates";
import { SIZE_PRESETS } from "@/lib/templates";
import type { TemplateAdminRow, TemplateCategoryOption } from "./types";

const schema = z.object({
  slug: z.string().trim().min(2).max(80),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300),
  categorySlug: z.string().min(1, "Pick a category"),
  sizePreset: z.string().min(1, "Pick a size"),
  style: z.string().max(200),
  colors: z.string().max(200),
  tags: z.string().max(300),
  premium: z.boolean(),
  documentJson: z.string().trim().min(2, "Paste or load a document"),
});
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  slug: "",
  title: "",
  description: "",
  categorySlug: "",
  sizePreset: "",
  style: "",
  colors: "",
  tags: "",
  premium: false,
  documentJson: "",
};

/** The fields shared by create and edit: metadata + the raw editor-core document + a project loader. */
function TemplateFields({ categories }: { categories: TemplateCategoryOption[] }) {
  const t = useTranslations("templates.admin");
  const form = useFormContext<Values>();
  const [projectId, setProjectId] = useState("");
  const [loadingProject, setLoadingProject] = useState(false);

  async function loadFromProject() {
    if (!projectId.trim()) return;
    setLoadingProject(true);
    const result = await getProjectDocument(projectId);
    setLoadingProject(false);
    if (!result.ok) return toast.error(result.error);
    form.setValue("documentJson", JSON.stringify(result.document, null, 2), { shouldValidate: true });
    if (!form.getValues("title")) form.setValue("title", result.name);
  }

  return (
    <>
      <FormInput<Values> name="title" label={t("titleField")} />
      <FormInput<Values> name="slug" label={t("slug")} description="a-z, 0-9, dashes" />
      <FormTextarea<Values> name="description" label={t("descriptionField")} maxLength={300} rows={2} />
      <FormSelect<Values>
        name="categorySlug"
        label={t("category")}
        options={categories.map((c) => ({ value: c.slug, label: c.name }))}
      />
      <FormSelect<Values>
        name="sizePreset"
        label={t("sizePreset")}
        options={SIZE_PRESETS.map((s) => ({ value: s.id, label: s.label }))}
      />
      <FormInput<Values> name="style" label={t("style")} placeholder="bold, modern" />
      <FormInput<Values> name="colors" label={t("colors")} placeholder="#10112A, #FFFFFF" />
      <FormInput<Values> name="tags" label={t("tags")} placeholder="sale, summer" />
      <FormSwitch<Values> name="premium" label={t("premium")} />

      <div className="grid gap-1.5">
        <Label htmlFor="load-project-id">{t("saveFromProject")}</Label>
        <div className="flex gap-2">
          <Input
            id="load-project-id"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="cl..."
          />
          <Button type="button" variant="secondary" loading={loadingProject} onClick={() => void loadFromProject()}>
            {t("load")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("saveFromProjectHint")}</p>
      </div>

      <FormTextarea<Values> name="documentJson" label={t("document")} description={t("documentHint")} rows={10} />
    </>
  );
}

export function CreateTemplateForm({ categories }: { categories: TemplateCategoryOption[] }) {
  const t = useTranslations("templates.admin");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  async function onSubmit(values: Values) {
    const r = await createTemplate(values);
    if (r.ok) {
      toast.success(t("createdToast"));
      form.reset(EMPTY);
    } else {
      form.setError("root", { message: r.error });
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <TemplateFields categories={categories} />
      {form.formState.errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}
      <FormSubmit>{t("create")}</FormSubmit>
    </Form>
  );
}

export function EditTemplateSheet({
  template,
  categories,
  open,
  onOpenChange,
}: {
  template: TemplateAdminRow | null;
  categories: TemplateCategoryOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("templates.admin");
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: template
      ? {
          slug: template.slug,
          title: template.title,
          description: template.description ?? "",
          categorySlug: template.categorySlug,
          sizePreset: template.sizePreset,
          style: template.style.join(", "),
          colors: template.colors.join(", "),
          tags: template.tags.join(", "),
          premium: template.premium,
          documentJson: template.documentJson,
        }
      : EMPTY,
  });

  async function onSubmit(values: Values) {
    if (!template) return;
    const r = await updateTemplate(template.id, values);
    if (r.ok) {
      toast.success(t("updatedToast"));
      onOpenChange(false);
    } else {
      form.setError("root", { message: r.error });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle className="font-display text-xl">{t("editTemplate")}</SheetTitle>
          <SheetDescription className="truncate font-mono">{template?.slug}</SheetDescription>
        </SheetHeader>
        <Form form={form} onSubmit={onSubmit} className="p-4">
          <TemplateFields categories={categories} />
          {form.formState.errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <FormSubmit>{t("save")}</FormSubmit>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
