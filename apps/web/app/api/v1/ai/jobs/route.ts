import { createAIJobInput } from "@pixelforge/shared";
import { z } from "zod";
import { createJob, serializeJob } from "@/lib/ai/jobs";
import { track } from "@/lib/analytics";
import { parseJson, requireUser, route } from "@/lib/api";

/** The job itself runs after the response (lib/jobs/run.ts); Vercel Hobby caps this at 300 s. */
export const maxDuration = 300;

const IdempotencyKey = z.string().trim().min(8).max(128);

/** Start an AI job: 202 with the job. A repeated Idempotency-Key returns the original job with 200. */
export const POST = route(async (req) => {
  const user = await requireUser();
  const key = IdempotencyKey.parse(req.headers.get("idempotency-key") ?? "");
  const body = await parseJson(req, createAIJobInput);
  const { job, replayed } = await createJob(user, key, body);
  if (!replayed) {
    track("ai_job_requested", { tool: job.tool }, user.id);
    track("credits_spent", { tool: job.tool, credits: job.costCredits }, user.id);
  }
  return Response.json(await serializeJob(job), { status: replayed ? 200 : 202 });
});
