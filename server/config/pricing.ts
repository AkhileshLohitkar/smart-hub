import {
  FREE_PLAN_WORKSHEETS_INCLUDED,
  PRICING_PLANS,
  PRICING_PLAN_ORDER,
  TOP_UP_PLANS,
  TOP_UP_PLAN_ORDER,
  getPlanAmountInr,
  getWorksheetLimitForPlanName,
  planNameMatchesBasePlan,
  type BillingCycle,
  type PaidWorksheetPlanKey,
  type PlanType,
  type WorksheetPlanKey,
} from "@shared/pricing";

export type { BillingCycle, WorksheetPlanKey, PaidWorksheetPlanKey };
export {
  FREE_PLAN_WORKSHEETS_INCLUDED,
  PRICING_PLANS as pricingPlans,
  PRICING_PLAN_ORDER,
  TOP_UP_PLANS as topUpPlans,
  TOP_UP_PLAN_ORDER,
  getPlanAmountInr,
  getWorksheetLimitForPlanName,
  getSubscriptionPlanName,
  getWorksheetQuotaPeriod,
  planNameMatchesBasePlan,
  resolvePaidPlanKeyFromPlanName,
  inferBillingCycleFromPlanName,
  stripPlanCycleSuffix,
  buildPricingApiPayload,
  type PlanType,
} from "@shared/pricing";

export type PlanCategory = "parents" | "professional";

export type WorksheetPlan = (typeof PRICING_PLANS)[WorksheetPlanKey];

export type PricingPlans = typeof PRICING_PLANS;

export const FREE_WORKSHEET_LIMIT_MESSAGE =
  "You have reached your Free plan worksheet limit. Please upgrade your plan to generate more worksheets.";

export function getFreeWorksheetLimit(): number {
  return PRICING_PLANS.free_2.worksheetsIncluded;
}

export function isFreeWorksheetUser(user: {
  plan?: string | null;
  planType?: string | null;
  planName?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  // Match client profilePlanInfo: plan "free" always counts as free regardless of planType.
  if (user.plan === "free") return true;

  const effectivePlanType = (user.planType || "worksheet") as PlanType;
  if (effectivePlanType !== "worksheet") return false;

  const effectivePlanName = (user.planName || "").trim().toLowerCase();
  return !effectivePlanName || ["free", "basic"].includes(effectivePlanName);
}

export function getWorksheetLimitForUser(user: {
  plan?: string | null;
  planType?: string | null;
  planName?: string | null;
  billingCycle?: string | null;
  topUpWorksheetsBalance?: number | null;
} | null | undefined): number | null {
  if (!user) return null;

  if (isFreeWorksheetUser(user)) {
    return getFreeWorksheetLimit();
  }

  if (user.plan !== "paid") return null;

  const baseLimit = getWorksheetLimitForPlanName(user.planName, user.billingCycle);
  if (baseLimit == null) return null;

  const topUp = Math.max(0, user.topUpWorksheetsBalance ?? 0);
  return baseLimit + topUp;
}

export function userEligibleForTopUp(
  user: {
    plan?: string | null;
    planName?: string | null;
    planExpiresAt?: Date | string | null;
  } | null | undefined,
  basePlanKey: PaidWorksheetPlanKey,
): boolean {
  if (!user || user.plan !== "paid") return false;
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return false;
  return planNameMatchesBasePlan(user.planName, basePlanKey);
}

export function userEligibleForUniversalTopUp(
  user: {
    plan?: string | null;
    planExpiresAt?: Date | string | null;
  } | null | undefined,
): boolean {
  if (!user || user.plan !== "paid") return false;
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return false;
  return true;
}

export function hasUserReachedWorksheetLimit(user: {
  plan?: string | null;
  planType?: string | null;
  planName?: string | null;
  billingCycle?: string | null;
  worksheetsGenerated?: number | null;
  topUpWorksheetsBalance?: number | null;
} | null | undefined): boolean {
  if (!user) return true;
  const limit = getWorksheetLimitForUser(user);
  if (limit == null) return false;
  return (user.worksheetsGenerated ?? 0) >= limit;
}

/** @deprecated Prefer hasUserReachedWorksheetLimit(user) */
export function hasReachedFreeWorksheetLimit(worksheetsGenerated: number): boolean {
  return worksheetsGenerated >= getFreeWorksheetLimit();
}
