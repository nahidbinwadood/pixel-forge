import "server-only";
import { Prisma, prisma } from "@pixelforge/db";
import { type EditorDocument, migrate } from "@pixelforge/editor-core";
import { personalWorkspaceId } from "@/lib/account";
import { notFound } from "@/lib/api";
import { renderTemplatePreviewSvg, svgToDataUrl } from "@/lib/template-preview";

// Re-exported for server-side callers that already import it from here; the definition lives in
// template-filters.ts (not server-only) so client components can import it too.
export { SIZE_PRESETS } from "@/lib/template-filters";

export function publicAssetUrl(storageKey: string): string {
  const base = process.env.PUBLIC_ASSET_BASE_URL ?? "";
  return `${base}/${storageKey}`;
}

export interface TemplateSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  categorySlug: string;
  categoryName: string;
  width: number;
  height: number;
  sizePreset: string;
  style: string[];
  colors: string[];
  tags: string[];
  premium: boolean;
  useCount: number;
  previewDataUrl: string;
}

type TemplateRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  width: number;
  height: number;
  sizePreset: string;
  style: string[];
  colors: string[];
  tags: string[];
  premium: boolean;
  useCount: number;
  document: Prisma.JsonValue;
  categorySlug: string;
  categoryName: string;
};

/** Collects Asset.id referenced by page backgrounds/image nodes across documents, resolved in one query. */
async function resolveAssetUrls(docs: EditorDocument[]): Promise<Record<string, string>> {
  const ids = new Set<string>();
  for (const doc of docs) {
    for (const page of doc.pages) {
      if (page.background.type === "image") ids.add(page.background.assetId);
      for (const node of page.nodes) if (node.type === "image") ids.add(node.assetId);
    }
  }
  if (ids.size === 0) return {};
  const assets = await prisma.asset.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, storageKey: true },
  });
  return Object.fromEntries(assets.map((a) => [a.id, publicAssetUrl(a.storageKey)]));
}

function toSummary(row: TemplateRow, assetUrls: Record<string, string>): TemplateSummary {
  const doc = row.document as unknown as EditorDocument;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
    width: row.width,
    height: row.height,
    sizePreset: row.sizePreset,
    style: row.style,
    colors: row.colors,
    tags: row.tags,
    premium: row.premium,
    useCount: row.useCount,
    previewDataUrl: svgToDataUrl(renderTemplatePreviewSvg(doc, assetUrls)),
  };
}

export async function listTemplateCategories() {
  return prisma.templateCategory.findMany({ orderBy: { sortOrder: "asc" } });
}

/** Ids of templates the user has favorited — cheap, used to pre-mark hearts in the browser. */
export async function listFavoriteTemplateIds(userId: string): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId, targetType: "template" },
    select: { targetId: true },
  });
  return rows.map((r) => r.targetId);
}

export interface TemplateListParams {
  q?: string;
  category?: string;
  sizePreset?: string;
  style?: string;
  color?: string;
  premium?: boolean;
  cursor?: string;
  limit?: number;
}

export interface TemplateListResult {
  items: TemplateSummary[];
  nextCursor: string | null;
}

/**
 * Search + filter, full-text ranked via the `searchVector` GIN index (PRD US7.1: p95 < 500ms).
 * Pagination is offset-based (the cursor is the next offset, opaque to the client): keyset
 * pagination against a rank-ordered result set needs a rank tie-breaker, which isn't worth the
 * complexity at this content scale (tens of thousands of templates, not millions).
 */
export async function listTemplates(params: TemplateListParams): Promise<TemplateListResult> {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 60);
  const offset = Math.max(Number(params.cursor) || 0, 0);
  const q = params.q?.trim() || undefined;

  const conditions: Prisma.Sql[] = [Prisma.sql`t."publishedAt" IS NOT NULL`];
  if (params.category) conditions.push(Prisma.sql`c.slug = ${params.category}`);
  if (params.sizePreset) conditions.push(Prisma.sql`t."sizePreset" = ${params.sizePreset}`);
  if (params.style) conditions.push(Prisma.sql`${params.style} = ANY(t.style)`);
  if (params.color) conditions.push(Prisma.sql`${params.color} = ANY(t.colors)`);
  if (params.premium !== undefined) conditions.push(Prisma.sql`t.premium = ${params.premium}`);
  if (q) conditions.push(Prisma.sql`t."searchVector" @@ plainto_tsquery('english', ${q})`);

  const where = Prisma.join(conditions, " AND ");
  const orderBy = q
    ? Prisma.sql`ts_rank(t."searchVector", plainto_tsquery('english', ${q})) DESC, t."publishedAt" DESC`
    : Prisma.sql`t."publishedAt" DESC`;

  const rows = await prisma.$queryRaw<TemplateRow[]>`
    SELECT t.id, t.slug, t.title, t.description, t.width, t.height, t."sizePreset", t.style, t.colors,
           t.tags, t.premium, t."useCount", t.document, c.slug AS "categorySlug", c.name AS "categoryName"
    FROM "Template" t
    JOIN "TemplateCategory" c ON c.id = t."categoryId"
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ${limit + 1} OFFSET ${offset}
  `;

  const page = rows.slice(0, limit);
  const assetUrls = await resolveAssetUrls(page.map((r) => r.document as unknown as EditorDocument));
  return {
    items: page.map((r) => toSummary(r, assetUrls)),
    nextCursor: rows.length > limit ? String(offset + limit) : null,
  };
}

export interface TemplateDetail extends TemplateSummary {
  similar: TemplateSummary[];
}

export async function getTemplateDetail(id: string): Promise<TemplateDetail> {
  const row = await prisma.template.findFirst({
    where: { id, publishedAt: { not: null } },
    include: { category: true },
  });
  if (!row) throw notFound("Template");

  const similarRows = await prisma.template.findMany({
    where: { categoryId: row.categoryId, publishedAt: { not: null }, id: { not: row.id } },
    include: { category: true },
    orderBy: { useCount: "desc" },
    take: 6,
  });

  const assetUrls = await resolveAssetUrls([row, ...similarRows].map((r) => r.document as unknown as EditorDocument));
  const toRow = (r: typeof row): TemplateRow => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    width: r.width,
    height: r.height,
    sizePreset: r.sizePreset,
    style: r.style,
    colors: r.colors,
    tags: r.tags,
    premium: r.premium,
    useCount: r.useCount,
    document: r.document,
    categorySlug: r.category.slug,
    categoryName: r.category.name,
  });

  return { ...toSummary(toRow(row), assetUrls), similar: similarRows.map((r) => toSummary(toRow(r), assetUrls)) };
}

/** "Use template" (PRD US7.2): a fresh Project copy, the template document re-validated via migrate(). */
export async function useTemplate(userId: string, templateId: string): Promise<{ projectId: string }> {
  const template = await prisma.template.findFirst({ where: { id: templateId, publishedAt: { not: null } } });
  if (!template) throw notFound("Template");
  const doc = migrate(template.document);
  const workspaceId = await personalWorkspaceId(userId);

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        workspaceId,
        creatorId: userId,
        templateId: template.id,
        name: template.title,
        width: template.width,
        height: template.height,
        document: doc,
        schemaVersion: doc.schemaVersion,
      },
    });
    await tx.template.update({ where: { id: template.id }, data: { useCount: { increment: 1 } } });
    await tx.recentUse.upsert({
      where: { userId_targetType_targetId: { userId, targetType: "template", targetId: template.id } },
      update: { usedAt: new Date() },
      create: { userId, targetType: "template", targetId: template.id },
    });
    return p;
  });
  return { projectId: project.id };
}
