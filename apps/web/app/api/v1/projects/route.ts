import { parseJson, requireUser, route } from "@/lib/api";
import { createProject, listProjects } from "@/lib/projects";
import { CreateProject, ListProjectsQuery } from "@/lib/projects-schema";
import { rateLimit } from "@/lib/rate-limit";

export const GET = route(async (req) => {
  const user = await requireUser();
  const query = ListProjectsQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
  return Response.json(await listProjects(user.id, query));
});

export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit(`project-create:${user.id}`, 60, 60);
  const input = await parseJson(req, CreateProject);
  return Response.json(await createProject(user.id, input), { status: 201 });
});
