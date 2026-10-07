import { requireUser, route } from "@/lib/api";
import { duplicateProject } from "@/lib/projects";
import { rateLimit } from "@/lib/rate-limit";

export const POST = route<{ id: string }>(async (_req, { id }) => {
  const user = await requireUser();
  await rateLimit(`project-create:${user.id}`, 60, 60);
  return Response.json(await duplicateProject(user.id, id), { status: 201 });
});
