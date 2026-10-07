import { prisma } from "@pixelforge/db";
import { z } from "zod";
import { parseJson, requireUser, route } from "@/lib/api";
import { getTemplateDetail } from "@/lib/templates";

const TargetType = z.enum(["template", "asset", "font", "ai_job"]);
const Body = z.object({ targetType: TargetType, targetId: z.string().min(1).max(64) });

/** Recently used (PRD US8.4). "Use template" records one automatically; other features can call POST. */
export const GET = route(async (req) => {
  const user = await requireUser();
  const targetType = TargetType.optional().parse(new URL(req.url).searchParams.get("targetType") || undefined);

  const rows = await prisma.recentUse.findMany({
    where: { userId: user.id, ...(targetType ? { targetType } : {}) },
    orderBy: { usedAt: "desc" },
    take: 20,
  });

  const templates = await Promise.all(
    rows.filter((r) => r.targetType === "template").map((r) => getTemplateDetail(r.targetId).catch(() => null)),
  );
  const templateById = new Map(templates.filter((t) => t !== null).map((t) => [t.id, t]));

  return Response.json({
    items: rows.map((r) => ({
      targetType: r.targetType,
      targetId: r.targetId,
      usedAt: r.usedAt,
      template: r.targetType === "template" ? (templateById.get(r.targetId) ?? null) : undefined,
    })),
  });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const { targetType, targetId } = await parseJson(req, Body);
  await prisma.recentUse.upsert({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
    update: { usedAt: new Date() },
    create: { userId: user.id, targetType, targetId },
  });
  return new Response(null, { status: 204 });
});
