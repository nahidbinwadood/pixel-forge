import { ContentBlockedError, ProviderError } from "@pixelforge/ai";

export type Outcome =
  | { kind: "blocked"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "retry"; message: string };

/**
 * What to do with a job whose run threw. Blocked content and permanent provider errors end the job now;
 * transient errors retry until the last attempt, which then ends the job as failed (and refunds).
 */
export function classifyFailure(err: unknown, attemptsMade: number, maxAttempts: number): Outcome {
  const message = err instanceof Error ? err.message : String(err);
  if (err instanceof ContentBlockedError) return { kind: "blocked", message };
  const retryable = !(err instanceof ProviderError) || err.retryable;
  const isLast = attemptsMade + 1 >= maxAttempts;
  return retryable && !isLast ? { kind: "retry", message } : { kind: "failed", message };
}

/** User-facing message stored on the job. Provider internals stay in logs. */
export function publicError(o: Outcome): string {
  return o.kind === "blocked"
    ? "The result didn't pass our content policy. Your credits were refunded."
    : "The AI provider couldn't finish this job. Your credits were refunded.";
}
