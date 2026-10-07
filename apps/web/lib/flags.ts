import "server-only";
import { prisma } from "@pixelforge/db";
import { evaluate, type Flag, type FlagUser } from "./flag-rules";

let cache: { at: number; flags: Flag[] } | null = null;

async function load() {
  if (!cache || Date.now() - cache.at > 30_000) {
    const flags = await prisma.featureFlag.findMany({ select: { key: true, enabled: true, rules: true } });
    cache = { at: Date.now(), flags };
  }
  return cache.flags;
}

export async function isEnabled(key: string, user?: FlagUser | null) {
  const flag = (await load()).find((f) => f.key === key);
  return flag ? evaluate(flag, user) : false;
}

export async function allFlags(user?: FlagUser | null): Promise<Record<string, boolean>> {
  return Object.fromEntries((await load()).map((f) => [f.key, evaluate(f, user)]));
}

export function clearFlagCache() {
  cache = null;
}
