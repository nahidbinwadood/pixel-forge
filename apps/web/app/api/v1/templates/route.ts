import { z } from "zod";
import { route } from "@/lib/api";
import { listTemplates } from "@/lib/templates";

const Query = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(64).optional(),
  sizePreset: z.string().trim().max(64).optional(),
  style: z.string().trim().max(32).optional(),
  color: z.string().trim().max(32).optional(),
  premium: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

/** Browse/search templates (PRD US7.1). Public: anyone can browse before signing up. */
export const GET = route(async (req) => {
  const params = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const result = await listTemplates(params);
  return Response.json(result);
});
