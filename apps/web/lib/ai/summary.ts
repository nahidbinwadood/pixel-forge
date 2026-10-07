/** One-line description of a job for history lists (pure, isomorphic). */
export function historySummary(tool: string, input: unknown): string {
  const i = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const text = tool === "text_to_image" ? i.prompt : tool === "write" ? i.topic : null;
  if (typeof text === "string" && text.trim()) {
    const t = text.trim().replace(/\s+/g, " ");
    return t.length > 120 ? `${t.slice(0, 119)}…` : t;
  }
  return tool === "bg_remove" ? "Background removal" : tool;
}

/** First day of next month (UTC): when the monthly top-up runs. */
export function nextRefillDate(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
