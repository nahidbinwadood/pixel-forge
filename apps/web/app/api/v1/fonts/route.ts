import { prisma } from "@pixelforge/db";
import { route } from "@/lib/api";

/** Font library (editor's font picker + templates metadata). Google-sourced fonts load via next/font at use time. */
export const GET = route(async () => {
  const fonts = await prisma.font.findMany({ orderBy: { family: "asc" } });
  return Response.json({
    items: fonts.map((f) => ({ family: f.family, weights: f.weights, premium: f.premium, license: f.license })),
  });
});
