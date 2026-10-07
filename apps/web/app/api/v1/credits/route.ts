import { creditBalance, userPlan } from "@/lib/account";
import { requireUser, route } from "@/lib/api";

export const GET = route(async () => {
  const user = await requireUser();
  const [balance, plan] = await Promise.all([creditBalance(user.id), userPlan(user.id)]);
  return Response.json({ balance, plan: plan.id, monthlyCredits: plan.monthlyCredits });
});
