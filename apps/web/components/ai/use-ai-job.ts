"use client";

import type { CreateAIJobInput } from "@pixelforge/shared";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { type AIJobView, isTerminal } from "./types";

const POLL_MS = 1_500;

export type JobError =
  | { kind: "credits"; balance: number; cost: number }
  | { kind: "blocked"; message: string }
  | { kind: "other"; message: string };

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

/**
 * Starts an AI job and polls it to completion (ASSUMPTIONS D11). Each submit gets a fresh Idempotency-Key,
 * so a double click or a network retry of the same submit can't charge twice.
 * Refreshes server components on start/finish so the credit meter stays in sync.
 */
export function useAIJob({ userId, onDone }: { userId: string; onDone?: (job: AIJobView) => void }) {
  const router = useRouter();
  const [job, setJob] = useState<AIJobView | null>(null);
  const [error, setError] = useState<JobError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const poll = useCallback(
    (id: string) => {
      timer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/v1/ai/jobs/${id}`, { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          const next = (await res.json()) as AIJobView;
          setJob(next);
          if (isTerminal(next.status)) {
            track(next.status === "succeeded" ? "ai_job_completed" : "ai_job_failed", { tool: next.tool }, userId);
            router.refresh();
            onDoneRef.current?.(next);
            return;
          }
        } catch {
          // Transient network error: keep polling; the job itself is unaffected.
        }
        poll(id);
      }, POLL_MS);
    },
    [router, userId],
  );

  const run = useCallback(
    async (body: CreateAIJobInput): Promise<JobError | null> => {
      if (timer.current) clearTimeout(timer.current);
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/ai/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const { error: e } = (await res.json().catch(() => ({}))) as ApiErrorBody;
          const d = (e?.details ?? {}) as { balance?: number; cost?: number };
          const err: JobError =
            res.status === 402
              ? { kind: "credits", balance: d.balance ?? 0, cost: d.cost ?? 0 }
              : res.status === 422
                ? { kind: "blocked", message: e?.message ?? "" }
                : { kind: "other", message: e?.message ?? "" };
          setError(err);
          return err;
        }
        const created = (await res.json()) as AIJobView;
        setJob(created);
        router.refresh();
        if (isTerminal(created.status)) onDoneRef.current?.(created);
        else poll(created.id);
        return null;
      } catch {
        const err: JobError = { kind: "other", message: "" };
        setError(err);
        return err;
      } finally {
        setSubmitting(false);
      }
    },
    [poll, router],
  );

  const busy = submitting || (job !== null && !isTerminal(job.status));
  return { job, setJob, error, run, busy, submitting };
}
