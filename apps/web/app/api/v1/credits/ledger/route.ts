import { z } from "zod";
import { listLedger } from "@/lib/ai/credits";
import { requireUser, route } from "@/lib/api";

const Query = z.object({
  cursor: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

/** The caller's credit ledger, paginated by cursor (newest first). */
export const GET = route(async (req) => {
  const user = await requireUser();
  const q = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
  return Response.json(await listLedger(user.id, q));
});
