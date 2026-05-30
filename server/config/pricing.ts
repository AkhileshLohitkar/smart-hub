import { FREE_PLAN_WORKSHEETS_INCLUDED } from "@shared/worksheetLimits";

// NOTE: Internally we still store planType/planName on the user row,
// but pricing is now worksheet-count based (not per-student).
export type PlanType = "worksheet";
export type BillingCycle = "monthly" | "yearly";

export type WorksheetPlanKey =
  | "free_2"
  | "w50"
  | "w100"
  | "w200"
  | "w400";

export type WorksheetPlan = {
  key: WorksheetPlanKey;
  name: string;
  worksheetsIncluded: number;
  monthlyPrice: number; // INR
  yearlyPrice: number | null; // INR (MRP)
  yearlyDiscountedPrice: number | null; // INR (payable)
  topUpWorksheetsPerMonth: number | null;
  topUpPrice: number | null; // INR
  popular?: boolean;
};

export const pricingPlans = {
  free_2: {
    key: "free_2",
    name: "Free",
    worksheetsIncluded: FREE_PLAN_WORKSHEETS_INCLUDED,
    monthlyPrice: 0,
    yearlyPrice: null,
    yearlyDiscountedPrice: null,
    topUpWorksheetsPerMonth: null,
    topUpPrice: null,
  },
  w50: {
    key: "w50",
    name: "50 Worksheets",
    worksheetsIncluded: 50,
    monthlyPrice: 199,
    yearlyPrice: 2399,
    yearlyDiscountedPrice: 2149,
    topUpWorksheetsPerMonth: 25,
    topUpPrice: 99,
    popular: true,
  },
  w100: {
    key: "w100",
    name: "100 Worksheets",
    worksheetsIncluded: 100,
    monthlyPrice: 399,
    yearlyPrice: 4799,
    yearlyDiscountedPrice: 4299,
    topUpWorksheetsPerMonth: 50,
    topUpPrice: 199,
  },
  w200: {
    key: "w200",
    name: "200 Worksheets",
    worksheetsIncluded: 200,
    monthlyPrice: 799,
    yearlyPrice: 9599,
    yearlyDiscountedPrice: 8599,
    topUpWorksheetsPerMonth: 100,
    topUpPrice: 399,
  },
  w400: {
    key: "w400",
    name: "400 Worksheets",
    worksheetsIncluded: 400,
    monthlyPrice: 1599,
    yearlyPrice: 19199,
    yearlyDiscountedPrice: 17199,
    topUpWorksheetsPerMonth: 200,
    topUpPrice: 799,
  },
  order: ["free_2", "w50", "w100", "w200", "w400"] as const satisfies readonly WorksheetPlanKey[],
} as const;

export type PricingPlans = typeof pricingPlans;

export const FREE_WORKSHEET_LIMIT_MESSAGE =
  "You have reached your free worksheet limit. Upgrade your plan to continue.";

export function getFreeWorksheetLimit(): number {
  return pricingPlans.free_2.worksheetsIncluded;
}

export function isFreeWorksheetUser(user: {
  plan?: string | null;
  planType?: string | null;
  planName?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  const effectivePlanType = (user.planType || "worksheet") as PlanType;
  if (effectivePlanType !== "worksheet") return false;

  if (user.plan === "free") return true;

  const effectivePlanName = (user.planName || "Free").trim().toLowerCase();
  return ["free", "basic"].includes(effectivePlanName);
}

export function getWorksheetLimitForUser(user: {
  plan?: string | null;
  planType?: string | null;
  planName?: string | null;
} | null | undefined): number | null {
  if (!isFreeWorksheetUser(user)) return null;
  return getFreeWorksheetLimit();
}

export function hasUserReachedWorksheetLimit(user: {
  plan?: string | null;
  planType?: string | null;
  planName?: string | null;
  worksheetsGenerated?: number | null;
} | null | undefined): boolean {
  if (!user || !isFreeWorksheetUser(user)) return false;
  const limit = getFreeWorksheetLimit();
  return (user.worksheetsGenerated ?? 0) >= limit;
}

/** @deprecated Prefer hasUserReachedWorksheetLimit(user) */
export function hasReachedFreeWorksheetLimit(worksheetsGenerated: number): boolean {
  return worksheetsGenerated >= getFreeWorksheetLimit();
}

export type PaidWorksheetPlanKey = Exclude<WorksheetPlanKey, "free_2">;

export function getPlanAmountInr(
  planKey: PaidWorksheetPlanKey,
  billingCycle: BillingCycle,
): number {
  const plan: WorksheetPlan = pricingPlans[planKey];
  if (billingCycle === "monthly") return plan.monthlyPrice;
  return plan.yearlyDiscountedPrice ?? plan.yearlyPrice ?? plan.monthlyPrice * 12;
}

