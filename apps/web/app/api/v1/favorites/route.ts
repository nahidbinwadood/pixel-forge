import { prisma } from "@pixelforge/db";
import { z } from "zod";
import { parseJson, requireUser, route } from "@/lib/api";
import { getTemplateDetail } from "@/lib/templates";

const TargetType = z.enum(["template", "asset", "font", "ai_job"]);
const Body = z.object({ targetType: TargetType, targetId: z.string().min(1).max(64) });

/** Favorites are polymorphic (PRD US8.4): template, asset, font or ai_job. */
export const GET = route(async (req) => {
  const user = await requireUser();
  const targetType = TargetType.optional().parse(new URL(req.url).searchParams.get("targetType") || undefined);

  const rows = await prisma.favorite.findMany({
    where: { userId: user.id, ...(targetType ? { targetType } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Templates get expanded (the only consumer today: the templates browser's "Favorites" filter).
  const templates = await Promise.all(
    rows.filter((r) => r.targetType === "template").map((r) => getTemplateDetail(r.targetId).catch(() => null)),
  );
  const templateById = new Map(templates.filter((t) => t !== null).map((t) => [t.id, t]));

  return Response.json({
    items: rows.map((r) => ({
      targetType: r.targetType,
      targetId: r.targetId,
      createdAt: r.createdAt,
      template: r.targetType === "template" ? (templateById.get(r.targetId) ?? null) : undefined,
    })),
  });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const { targetType, targetId } = await parseJson(req, Body);
  await prisma.favorite.upsert({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
    update: {},
    create: { userId: user.id, targetType, targetId },
  });
  return new Response(null, { status: 204 });
});

export const DELETE = route(async (req) => {
  const user = await requireUser();
  const { targetType, targetId } = Body.parse(Object.fromEntries(new URL(req.url).searchParams));
  await prisma.favorite
    .delete({ where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } } })
    .catch(() => null); // idempotent: already-removed is not an error
  return new Response(null, { status: 204 });
});
