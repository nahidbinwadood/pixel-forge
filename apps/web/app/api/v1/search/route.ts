import { prisma } from "@pixelforge/db";
import { z } from "zod";
import { personalWorkspaceId } from "@/lib/account";
import { requireUser, route } from "@/lib/api";
import { presignGet } from "@/lib/storage";
import { listTemplates } from "@/lib/templates";

const Types = z.enum(["templates", "projects", "uploads"]);
const Query = z.object({
  q: z.string().trim().min(1).max(100),
  types: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((t) => Types.parse(t.trim())) : Types.options)),
});

/** Global search: templates, your designs and your uploads (search bar in the app shell). */
export const GET = route(async (req) => {
  const user = await requireUser();
  const { q, types } = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const workspaceId = await personalWorkspaceId(user.id);
  const wants = new Set(types);

  const [templates, projects, uploads] = await Promise.all([
    wants.has("templates") ? listTemplates({ q, limit: 8 }).then((r) => r.items) : Promise.resolve([]),
    wants.has("projects")
      ? prisma.project.findMany({
          where: { workspaceId, deletedAt: null, name: { contains: q, mode: "insensitive" } },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: { id: true, name: true, width: true, height: true, updatedAt: true },
        })
      : Promise.resolve([]),
    wants.has("uploads")
      ? prisma.asset.findMany({
          where: { workspaceId, kind: "upload", status: "ready", tags: { has: q.toLowerCase() } },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, variants: true, license: true },
        })
      : Promise.resolve([]),
  ]);

  return Response.json({
    templates,
    projects,
    uploads: await Promise.all(
      uploads.map(async (a) => ({
        id: a.id,
        name: (a.license as { filename?: string } | null)?.filename ?? null,
        thumbUrl: (a.variants as { thumb?: string }).thumb
          ? await presignGet((a.variants as { thumb: string }).thumb)
          : null,
      })),
    ),
  });
});
