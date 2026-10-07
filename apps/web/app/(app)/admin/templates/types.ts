export interface TemplateAdminRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  categorySlug: string;
  categoryName: string;
  sizePreset: string;
  style: string[];
  colors: string[];
  tags: string[];
  premium: boolean;
  published: boolean;
  useCount: number;
  updatedAt: string;
  documentJson: string;
}

export interface TemplateCategoryOption {
  slug: string;
  name: string;
}
