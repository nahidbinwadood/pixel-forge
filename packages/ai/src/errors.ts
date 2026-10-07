/** The provider (or our moderation) refused the content. Never retried; the job ends `blocked` and is refunded. */
export class ContentBlockedError extends Error {
  override readonly name = "ContentBlockedError";
}

/** Provider call failed. `retryable` = transient (timeout, 429, 5xx); otherwise the job fails at once. */
export class ProviderError extends Error {
  override readonly name = "ProviderError";
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

/** Classifies an HTTP status from a provider SDK. */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}
