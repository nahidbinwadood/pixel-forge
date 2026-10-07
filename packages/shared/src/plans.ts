/**
 * Plans, limits and AI credit costs. Config, not DB: changing a limit is a code review, not an admin click.
 * Stripe price IDs get attached in Phase 5; until then Subscription.planId is set by admin (ASSUMPTIONS D14).
 */
export type PlanId = "free" | "plus" | "pro" | "team";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyCredits: number;
  maxExportPx: number; // longest edge
  watermark: boolean;
  premiumContent: boolean;
  storageMb: number;
  seats: number;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyCredits: 30,
    maxExportPx: 2048,
    watermark: true,
    premiumContent: false,
    storageMb: 1024,
    seats: 1,
  },
  plus: {
    id: "plus",
    name: "Plus",
    monthlyCredits: 300,
    maxExportPx: 4096,
    watermark: false,
    premiumContent: true,
    storageMb: 20_480,
    seats: 1,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyCredits: 1000,
    maxExportPx: 8192,
    watermark: false,
    premiumContent: true,
    storageMb: 102_400,
    seats: 1,
  },
  team: {
    id: "team",
    name: "Team",
    monthlyCredits: 3000,
    maxExportPx: 8192,
    watermark: false,
    premiumContent: true,
    storageMb: 512_000,
    seats: 10,
  },
};

export type AITool = "bg_remove" | "text_to_image" | "write";

/** Credits charged per job (text_to_image: per variation). */
export const CREDIT_COSTS: Record<AITool, number> = {
  bg_remove: 1,
  text_to_image: 2,
  write: 1,
};

export function jobCost(tool: AITool, variations = 1): number {
  if (!Number.isInteger(variations) || variations < 1 || variations > 4) {
    throw new RangeError(`variations must be an integer 1-4, got ${variations}`);
  }
  return tool === "text_to_image" ? CREDIT_COSTS[tool] * variations : CREDIT_COSTS[tool];
}

export function canAfford(balance: number, tool: AITool, variations = 1): boolean {
  return balance >= jobCost(tool, variations);
}
