import { parseJson, requireUser, route } from "@/lib/api";
import { createVersion, listVersions } from "@/lib/projects";
import { CreateVersion } from "@/lib/projects-schema";
import { rateLimit } from "@/lib/rate-limit";

type Params = { id: string };

export const GET = route<Params>(async (_req, { id }) => {
  const user = await requireUser();
  return Response.json({ items: await listVersions(user.id, id) });
});

export const POST = route<Params>(async (req, { id }) => {
  const user = await requireUser();
  await rateLimit(`project-version:${user.id}`, 30, 60);
  const { label } = await parseJson(req, CreateVersion);
  return Response.json(await createVersion(user.id, id, label), { status: 201 });
});
