import { ApiError, parseJson, requireUser, route } from "@/lib/api";
import { findProject, saveDocument, updateMeta } from "@/lib/projects";
import { UpdateProject } from "@/lib/projects-schema";
import { rateLimit } from "@/lib/rate-limit";

type Params = { id: string };

/** 2 000 nodes of JSON stays well under this; anything bigger is not a real design. */
const MAX_BODY = 4 * 1024 * 1024;

export const GET = route<Params>(async (_req, { id }) => {
  const user = await requireUser();
  const p = await findProject(user.id, id);
  return Response.json({
    id: p.id,
    name: p.name,
    width: p.width,
    height: p.height,
    revision: p.revision,
    document: p.document,
    updatedAt: p.updatedAt,
  });
});

/** Autosave (`document` + base `revision`, 409 on conflict), rename, or move to/from trash. */
export const PATCH = route<Params>(async (req, { id }) => {
  const user = await requireUser();
  await rateLimit(`project-save:${user.id}`, 240, 60);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) {
    throw new ApiError(413, "TOO_LARGE", "This design is too large to save");
  }
  const input = await parseJson(req, UpdateProject);
  if (input.document !== undefined && input.revision !== undefined) {
    const saved = await saveDocument(user.id, id, input.revision, input.document, input.name);
    return Response.json(saved);
  }
  return Response.json(await updateMeta(user.id, id, input));
});

/** Moves the design to trash (restorable via PATCH {trashed:false}). Purge is backlog B-A1-2. */
export const DELETE = route<Params>(async (_req, { id }) => {
  const user = await requireUser();
  await updateMeta(user.id, id, { trashed: true });
  return new Response(null, { status: 204 });
});
