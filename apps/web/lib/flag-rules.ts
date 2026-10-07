import { createHash } from "node:crypto";

interface Rules {
  userIds?: string[];
  roles?: string[];
  percent?: number;
}
export interface FlagUser {
  id: string;
  role?: string | null;
}
export interface Flag {
  key: string;
  enabled: boolean;
  rules: unknown;
}

/** Stable 0-99 bucket per user+flag, so percentage rollouts don't flicker. */
export function bucket(userId: string, key: string) {
  return createHash("sha256").update(`${key}:${userId}`).digest().readUInt16BE(0) % 100;
}

/** No rules = on for everyone. With rules, the user must match at least one. */
export function evaluate(flag: Flag, user?: FlagUser | null): boolean {
  if (!flag.enabled) return false;
  const rules = flag.rules as Rules | null;
  if (!rules) return true;
  if (!user) return false;
  if (rules.userIds?.includes(user.id)) return true;
  if (user.role && rules.roles?.includes(user.role)) return true;
  if (rules.percent !== undefined) return bucket(user.id, flag.key) < rules.percent;
  return false;
}
