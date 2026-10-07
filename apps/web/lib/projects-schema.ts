import { CUSTOM_SIZE } from "@pixelforge/editor-core";
import { z } from "zod";

/** Request schemas for /api/v1/projects, shared by the client forms and the route handlers. */

export const projectName = z
  .string()
  .trim()
  .min(1, "Give your design a name")
  .max(120, "Keep the name under 120 characters");

const side = z
  .number({ error: "Enter a size in pixels" })
  .int("Use whole pixels")
  .min(CUSTOM_SIZE.min, `At least ${CUSTOM_SIZE.min} px`)
  .max(CUSTOM_SIZE.max, `At most ${CUSTOM_SIZE.max} px`);

export const CreateProject = z.object({
  name: projectName.optional(),
  width: side,
  height: side,
  /** Optional full document (e.g. a conflict copy); validated with migrate() on the server. */
  document: z.unknown().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProject>;

export const UpdateProject = z
  .object({
    name: projectName.optional(),
    document: z.unknown().optional(),
    /** The revision the client's document is based on. Required with `document`. */
    revision: z.number().int().min(0).optional(),
    trashed: z.boolean().optional(),
  })
  .refine((v) => v.document === undefined || v.revision !== undefined, {
    message: "revision is required when saving a document",
    path: ["revision"],
  });
export type UpdateProjectInput = z.infer<typeof UpdateProject>;

export const ListProjectsQuery = z.object({
  q: z.string().trim().max(100).optional(),
  cursor: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

export const CreateVersion = z.object({ label: z.string().trim().max(80).optional() });

/** "New design" form: a preset id, or "custom" with explicit sizes. */
export const NewDesignForm = z.object({
  preset: z.string().min(1),
  width: side,
  height: side,
});
export type NewDesignValues = z.infer<typeof NewDesignForm>;

export const RenameForm = z.object({ name: projectName });
export type RenameValues = z.infer<typeof RenameForm>;

/** Thumbnails are small PNG/WebP/JPEG renders of page 1. */
export const THUMBNAIL_MAX_BYTES = 512 * 1024;
export const THUMBNAIL_TYPES = ["image/png", "image/webp", "image/jpeg"] as const;
