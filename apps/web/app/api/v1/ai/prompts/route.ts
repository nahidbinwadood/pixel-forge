import { z } from "zod";
import { listHistory } from "@/lib/ai/history";
import { requireUser, route } from "@/lib/api";

const Query = z.object({
  tool: z.enum(["text_to_image", "bg_remove", "write"]).optional(),
  favorites: z.enum(["1", "0"]).optional(),
  cursor: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Prompt history = the caller's AIJob rows, newest first, optionally only favorites. */
export const GET = route(async (req) => {
  const user = await requireUser();
  const q = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
  return Response.json(
    await listHistory(user.id, { tool: q.tool, favoritesOnly: q.favorites === "1", cursor: q.cursor, limit: q.limit }),
  );
});
