import "server-only";
import { headers } from "next/headers";
import { ZodError, type z } from "zod";
import { auth } from "./auth";

/** Thrown anywhere inside a handler; rendered as the shared error shape (ARCHITECTURE §7). */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
    public headers?: Record<string, string>,
  ) {
    super(message);
  }
}

export const unauthorized = () => new ApiError(401, "UNAUTHORIZED", "Sign in required");
export const forbidden = () => new ApiError(403, "FORBIDDEN", "Not allowed");
export const notFound = (what = "Resource") => new ApiError(404, "NOT_FOUND", `${what} not found`);

export function errorResponse(e: unknown): Response {
  if (e instanceof ApiError) {
    return Response.json(
      { error: { code: e.code, message: e.message, details: e.details } },
      { status: e.status, headers: e.headers },
    );
  }
  if (e instanceof ZodError) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request", details: e.issues } },
      { status: 400 },
    );
  }
  console.error(e);
  return Response.json({ error: { code: "INTERNAL", message: "Something went wrong" } }, { status: 500 });
}

type RouteCtx<P> = { params: Promise<P> };

/** Wraps a route handler: awaits params, maps thrown errors to JSON responses. */
export function route<P = Record<string, never>>(fn: (req: Request, params: P) => Promise<Response>) {
  return async (req: Request, ctx: RouteCtx<P>) => {
    try {
      return await fn(req, await ctx.params);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Banned/deleted users have their sessions revoked, so a live session implies an active user. */
export async function requireUser(opts?: { admin?: boolean }) {
  const user = await getUser();
  if (!user) throw unauthorized();
  if (opts?.admin && user.role !== "admin") throw forbidden();
  return user;
}

export async function parseJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Body must be JSON");
  }
  return schema.parse(body);
}
