import { requireUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { useTemplate } from "@/lib/templates";

/** "Use template" (PRD US7.2): creates a Project from the template document; the template itself never changes. */
export const POST = route<{ id: string }>(async (_req, { id }) => {
  const user = await requireUser();
  await rateLimit(`template-use:${user.id}`, 30, 60);
  const result = await useTemplate(user.id, id);
  return Response.json(result, { status: 201 });
});
