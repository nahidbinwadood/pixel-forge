import "server-only";
import { type Prisma, prisma } from "@pixelforge/db";
import {
  CURRENT_SCHEMA_VERSION,
  createDocument,
  type EditorDocument,
  getPage,
  migrate,
  usedAssetIds,
} from "@pixelforge/editor-core";
import { personalWorkspaceId } from "./account";
import { ApiError, notFound } from "./api";
import type { CreateProjectInput } from "./projects-schema";
import { deleteObjects, presignGet, putObject } from "./storage";

/**
 * Projects service (My Designs + editor persistence). Every query is scoped to workspaces the user is a
 * member of; ids from the client are never trusted on their own.
 */

const memberOf = (userId: string) => ({ workspace: { members: { some: { userId } } } });
const json = (doc: EditorDocument) => doc as unknown as Prisma.InputJsonValue;

/** Validate any incoming document (ARCHITECTURE §2: every write goes through migrate()). */
export function validDocument(input: unknown): EditorDocument {
  try {
    return migrate(input);
  } catch (e) {
    throw new ApiError(400, "INVALID_DOCUMENT", "The design data is not valid", String(e));
  }
}

export async function findProject(userId: string, id: string, opts: { includeTrashed?: boolean } = {}) {
  const project = await prisma.project.findFirst({
    where: { id, ...memberOf(userId), ...(opts.includeTrashed ? {} : { deletedAt: null }) },
  });
  if (!project) throw notFound("Design");
  return project;
}

export interface ProjectCard {
  id: string;
  name: string;
  width: number;
  height: number;
  updatedAt: string;
  thumbUrl: string | null;
}

async function toCard(p: {
  id: string;
  name: string;
  width: number;
  height: number;
  updatedAt: Date;
  thumbnailKey: string | null;
}): Promise<ProjectCard> {
  return {
    id: p.id,
    name: p.name,
    width: p.width,
    height: p.height,
    updatedAt: p.updatedAt.toISOString(),
    thumbUrl: p.thumbnailKey ? await presignGet(p.thumbnailKey) : null,
  };
}

const cardSelect = { id: true, name: true, width: true, height: true, updatedAt: true, thumbnailKey: true } as const;

export async function listProjects(userId: string, opts: { q?: string; cursor?: string; limit: number }) {
  const rows = await prisma.project.findMany({
    where: {
      ...memberOf(userId),
      deletedAt: null,
      ...(opts.q ? { name: { contains: opts.q, mode: "insensitive" as const } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: opts.limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: cardSelect,
  });
  const page = rows.slice(0, opts.limit);
  return {
    items: await Promise.all(page.map(toCard)),
    nextCursor: rows.length > opts.limit ? (page.at(-1)?.id ?? null) : null,
  };
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const workspaceId = await personalWorkspaceId(userId);
  const document =
    input.document === undefined ? createDocument(input.width, input.height) : validDocument(input.document);
  const first = getPage(document);
  return prisma.project.create({
    data: {
      workspaceId,
      creatorId: userId,
      name: input.name ?? "Untitled design",
      width: first.width,
      height: first.height,
      document: json(document),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    },
    select: { id: true, name: true, revision: true },
  });
}

/**
 * Autosave with optimistic concurrency: the write only lands if the stored revision still equals the
 * client's base revision; otherwise 409 and the client keeps its copy (ARCHITECTURE §2).
 */
export async function saveDocument(userId: string, id: string, revision: number, input: unknown, name?: string) {
  const document = validDocument(input);
  const project = await findProject(userId, id);
  const first = getPage(document);
  const { count } = await prisma.project.updateMany({
    where: { id: project.id, revision },
    data: {
      document: json(document),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      width: first.width,
      height: first.height,
      revision: { increment: 1 },
      ...(name ? { name } : {}),
    },
  });
  if (count === 0) {
    throw new ApiError(409, "REVISION_CONFLICT", "This design was changed somewhere else", {
      currentRevision: project.revision,
    });
  }
  return { revision: revision + 1 };
}

export async function updateMeta(userId: string, id: string, input: { name?: string; trashed?: boolean }) {
  const project = await findProject(userId, id, { includeTrashed: true });
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.trashed === undefined ? {} : { deletedAt: input.trashed ? new Date() : null }),
    },
    select: { id: true, name: true, revision: true, deletedAt: true },
  });
  return updated;
}

export async function duplicateProject(userId: string, id: string) {
  const source = await findProject(userId, id);
  return prisma.project.create({
    data: {
      workspaceId: source.workspaceId,
      creatorId: userId,
      templateId: source.templateId,
      name: `${source.name} (copy)`.slice(0, 120),
      width: source.width,
      height: source.height,
      document: json(validDocument(source.document)),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      thumbnailKey: null,
    },
    select: { id: true, name: true },
  });
}

export async function listVersions(userId: string, id: string) {
  const project = await findProject(userId, id);
  return prisma.projectVersion.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, revision: true, label: true, createdAt: true },
  });
}

/** Snapshot the stored document (what the server has, not unsaved client state). */
export async function createVersion(userId: string, id: string, label?: string) {
  const project = await findProject(userId, id);
  return prisma.projectVersion.create({
    data: {
      projectId: project.id,
      revision: project.revision,
      document: project.document as Prisma.InputJsonValue,
      label: label || null,
    },
    select: { id: true, revision: true, label: true, createdAt: true },
  });
}

export async function setThumbnail(userId: string, id: string, bytes: Uint8Array, contentType: string) {
  const project = await findProject(userId, id);
  const ext = contentType.split("/")[1] ?? "png";
  const key = `thumbs/${project.workspaceId}/${project.id}.${ext}`;
  await putObject(key, bytes, contentType);
  if (project.thumbnailKey && project.thumbnailKey !== key) await deleteObjects([project.thumbnailKey]);
  await prisma.project.update({ where: { id: project.id }, data: { thumbnailKey: key } });
}

/** Signed URLs for the assets a document references, limited to the user's workspaces + global library. */
export async function assetUrls(userId: string, ids: readonly string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const rows = await prisma.asset.findMany({
    where: {
      id: { in: [...ids] },
      status: "ready",
      OR: [{ workspaceId: null }, { workspace: { members: { some: { userId } } } }],
    },
    select: { id: true, storageKey: true, variants: true },
  });
  const entries = await Promise.all(
    rows.map(async (a) => {
      // The 1600 px preview keeps CPU filters responsive (ASSUMPTIONS D7); full-res export is B-A1-1.
      const key = (a.variants as { preview?: string }).preview ?? a.storageKey;
      return [a.id, await presignGet(key, 6 * 60 * 60)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function recentProjects(userId: string, take = 6) {
  const rows = await prisma.project.findMany({
    where: { ...memberOf(userId), deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take,
    select: cardSelect,
  });
  return Promise.all(rows.map(toCard));
}

/** Everything the editor page needs, or null when the design doesn't exist for this user (→ 404). */
export async function openProject(userId: string, id: string) {
  const project = await prisma.project.findFirst({
    where: { id, ...memberOf(userId), deletedAt: null },
    select: { id: true, name: true, revision: true, document: true },
  });
  if (!project) return null;
  const document = migrate(project.document);
  return {
    project: { id: project.id, name: project.name, revision: project.revision, document },
    assetUrls: await assetUrls(userId, usedAssetIds(document)),
  };
}
