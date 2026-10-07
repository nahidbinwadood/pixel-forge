"use server";

import { type Prisma, prisma } from "@pixelforge/db";
import { migrate } from "@pixelforge/editor-core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "./api";

/** Admin template CRUD (PRD US7.4). Server actions, not REST (ASSUMPTIONS D26: internal UI only). */
type Result = { ok: true } | { ok: false; error: string };

async function run(fn: (adminId: string) => Promise<void>): Promise<Result> {
  try {
    const admin = await requireUser({ admin: true });
    await fn(admin.id);
    revalidatePath("/admin/templates");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input" };
    if (e instanceof Error) return { ok: false, error: e.message };
    return { ok: false, error: "Something went wrong" };
  }
}

function audit(actorId: string, action: string, targetType: string, targetId: string, meta: Prisma.InputJsonValue) {
  return prisma.auditLog.create({ data: { actorId, action, targetType, targetId, meta } });
}

/** Recomputes the search_vector column ($executeRaw — Prisma Client can't write `Unsupported` fields). */
async function refreshSearchVector(id: string) {
  await prisma.$executeRaw`
    UPDATE "Template" SET "searchVector" =
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C') ||
      setweight(to_tsvector('english', array_to_string(style, ' ')), 'C')
    WHERE id = ${id}
  `;
}

const csvList = (max: number) =>
  z
    .string()
    .trim()
    .transform((s) =>
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(40)).max(max));

const TemplateInput = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only")
    .min(2)
    .max(80),
  title: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => v || undefined),
  categorySlug: z.string().min(1),
  sizePreset: z.string().min(1).max(64),
  style: csvList(10),
  colors: csvList(10),
  tags: csvList(20),
  premium: z.boolean(),
  documentJson: z.string().min(2),
});

function parseDocument(json: string) {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("Document must be valid JSON");
  }
  try {
    return migrate(raw);
  } catch (e) {
    throw new Error(e instanceof Error ? `Document: ${e.message}` : "Document failed validation");
  }
}

export async function createTemplate(input: z.input<typeof TemplateInput>): Promise<Result> {
  return run(async (adminId) => {
    const data = TemplateInput.parse(input);
    const doc = parseDocument(data.documentJson);
    const page = doc.pages[0];
    if (!page) throw new Error("Document has no pages");

    const category = await prisma.templateCategory.findUnique({ where: { slug: data.categorySlug } });
    if (!category) throw new Error("Unknown category");
    if (await prisma.template.findUnique({ where: { slug: data.slug } })) {
      throw new Error("That slug is already in use");
    }

    const template = await prisma.template.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description ?? null,
        categoryId: category.id,
        width: page.width,
        height: page.height,
        sizePreset: data.sizePreset,
        style: data.style,
        colors: data.colors,
        tags: data.tags,
        premium: data.premium,
        document: doc,
        schemaVersion: doc.schemaVersion,
        createdById: adminId,
      },
    });
    await refreshSearchVector(template.id);
    await audit(adminId, "admin.template_create", "template", template.id, { slug: data.slug });
  });
}

export async function updateTemplate(id: string, input: z.input<typeof TemplateInput>): Promise<Result> {
  return run(async (adminId) => {
    const data = TemplateInput.parse(input);
    const doc = parseDocument(data.documentJson);
    const page = doc.pages[0];
    if (!page) throw new Error("Document has no pages");

    const existing = await prisma.template.findUniqueOrThrow({ where: { id } });
    const category = await prisma.templateCategory.findUnique({ where: { slug: data.categorySlug } });
    if (!category) throw new Error("Unknown category");
    if (data.slug !== existing.slug && (await prisma.template.findUnique({ where: { slug: data.slug } }))) {
      throw new Error("That slug is already in use");
    }

    await prisma.template.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description ?? null,
        categoryId: category.id,
        width: page.width,
        height: page.height,
        sizePreset: data.sizePreset,
        style: data.style,
        colors: data.colors,
        tags: data.tags,
        premium: data.premium,
        document: doc,
        schemaVersion: doc.schemaVersion,
      },
    });
    await refreshSearchVector(id);
    await audit(adminId, "admin.template_update", "template", id, { slug: data.slug });
  });
}

export async function setTemplatePublished(id: string, published: boolean): Promise<Result> {
  return run(async (adminId) => {
    const existing = await prisma.template.findUniqueOrThrow({ where: { id } });
    await prisma.template.update({ where: { id }, data: { publishedAt: published ? new Date() : null } });
    await audit(adminId, published ? "admin.template_publish" : "admin.template_unpublish", "template", id, {
      before: existing.publishedAt?.toISOString() ?? null,
    });
  });
}

/** Powers the "Save from project id" loader: read-only, admin-gated, no audit entry (nothing changed yet). */
export async function getProjectDocument(
  projectId: string,
): Promise<{ ok: true; name: string; document: unknown } | { ok: false; error: string }> {
  try {
    await requireUser({ admin: true });
    const project = await prisma.project.findUnique({
      where: { id: projectId.trim() },
      select: { name: true, document: true },
    });
    if (!project) return { ok: false, error: "No project with that id" };
    return { ok: true, name: project.name, document: project.document };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
