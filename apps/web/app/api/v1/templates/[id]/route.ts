import { route } from "@/lib/api";
import { getTemplateDetail } from "@/lib/templates";

export const GET = route<{ id: string }>(async (_req, { id }) => {
  const detail = await getTemplateDetail(id);
  return Response.json(detail);
});
