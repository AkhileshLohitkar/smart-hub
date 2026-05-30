import {
  getPlanAmountInr,
  pricingPlans,
  type BillingCycle,
  type PaidWorksheetPlanKey,
  type WorksheetPlanKey,
} from "../config/pricing";

export type RazorpayPlanPeriod = "monthly" | "yearly" | "one_time";

export type RazorpayPlanDef = {
  planKey: string;
  name: string;
  amount: number;
  currency: "INR";
  period: RazorpayPlanPeriod;
  description: string;
  worksheetPlanKey: WorksheetPlanKey;
  billingCycle: BillingCycle | null;
  kind: "base" | "topup" | "legacy";
  worksheetsIncluded: number;
};

function toPaise(inr: number): number {
  return Math.round(inr * 100);
}

export function buildWorksheetPlanKey(
  baseKey: WorksheetPlanKey,
  billingCycle: BillingCycle,
): string {
  return `${baseKey}_${billingCycle}`;
}

export function resolveAmountPaise(
  baseKey: PaidWorksheetPlanKey,
  billingCycle: BillingCycle,
): number {
  return toPaise(getPlanAmountInr(baseKey, billingCycle));
}

export function buildPublicRazorpayPlans(): RazorpayPlanDef[] {
  const paidKeys: PaidWorksheetPlanKey[] = ["w50", "w100", "w200", "w400"];
  const plans: RazorpayPlanDef[] = [];

  for (const key of paidKeys) {
    const plan = pricingPlans[key] as (typeof pricingPlans)["w50"];
    for (const cycle of ["monthly", "yearly"] as BillingCycle[]) {
      const amount = resolveAmountPaise(key, cycle);
      const amountInr = getPlanAmountInr(key, cycle);
      plans.push({
        planKey: buildWorksheetPlanKey(key, cycle),
        name: `${plan.name} (${cycle === "monthly" ? "Monthly" : "Yearly"})`,
        amount,
        currency: "INR",
        period: cycle,
        description:
          cycle === "monthly"
            ? `₹${plan.monthlyPrice}/month · ${plan.worksheetsIncluded} worksheets`
            : `₹${amountInr}/year · ${plan.worksheetsIncluded} worksheets/month`,
        worksheetPlanKey: key,
        billingCycle: cycle,
        kind: "base",
        worksheetsIncluded: plan.worksheetsIncluded,
      });
    }

    if (plan.topUpPrice != null && plan.topUpWorksheetsPerMonth != null) {
      plans.push({
        planKey: `${key}_topup`,
        name: `Top-up: +${plan.topUpWorksheetsPerMonth} Worksheets`,
        amount: toPaise(plan.topUpPrice),
        currency: "INR",
        period: "one_time",
        description: `Add ${plan.topUpWorksheetsPerMonth} worksheets for ₹${plan.topUpPrice}`,
        worksheetPlanKey: key,
        billingCycle: null,
        kind: "topup",
        worksheetsIncluded: plan.topUpWorksheetsPerMonth,
      });
    }
  }

  return plans;
}

/** Legacy per-child plan keys for webhook / payment recovery. */
export const RAZORPAY_LEGACY_PLANS: RazorpayPlanDef[] = [
  {
    planKey: "starter_monthly",
    name: "Starter Monthly",
    amount: 9900,
    currency: "INR",
    period: "monthly",
    description: "Legacy: ₹99/month",
    worksheetPlanKey: "w50",
    billingCycle: "monthly",
    kind: "legacy",
    worksheetsIncluded: pricingPlans.w50.worksheetsIncluded,
  },
  {
    planKey: "starter_annual",
    name: "Starter Annual",
    amount: 99900,
    currency: "INR",
    period: "yearly",
    description: "Legacy: ₹999/year",
    worksheetPlanKey: "w50",
    billingCycle: "yearly",
    kind: "legacy",
    worksheetsIncluded: pricingPlans.w50.worksheetsIncluded,
  },
  {
    planKey: "family_monthly",
    name: "Family Monthly",
    amount: 18900,
    currency: "INR",
    period: "monthly",
    description: "Legacy: ₹189/month",
    worksheetPlanKey: "w100",
    billingCycle: "monthly",
    kind: "legacy",
    worksheetsIncluded: pricingPlans.w100.worksheetsIncluded,
  },
  {
    planKey: "family_annual",
    name: "Family Annual",
    amount: 179900,
    currency: "INR",
    period: "yearly",
    description: "Legacy: ₹1,799/year",
    worksheetPlanKey: "w100",
    billingCycle: "yearly",
    kind: "legacy",
    worksheetsIncluded: pricingPlans.w100.worksheetsIncluded,
  },
  {
    planKey: "no_watermark",
    name: "No Watermark",
    amount: 34900,
    currency: "INR",
    period: "yearly",
    description: "Legacy: ₹349/year",
    worksheetPlanKey: "w200",
    billingCycle: "yearly",
    kind: "legacy",
    worksheetsIncluded: pricingPlans.w200.worksheetsIncluded,
  },
];

export function getAllRazorpayPlans(): RazorpayPlanDef[] {
  return [...buildPublicRazorpayPlans(), ...RAZORPAY_LEGACY_PLANS];
}

export function resolveRazorpayPlan(
  planKey: string,
  billingCycle?: BillingCycle | null,
): RazorpayPlanDef | undefined {
  const all = getAllRazorpayPlans();
  const direct = all.find((p) => p.planKey === planKey);
  if (direct) return direct;

  const baseKeys: PaidWorksheetPlanKey[] = ["w50", "w100", "w200", "w400"];
  if (billingCycle && (baseKeys as string[]).includes(planKey)) {
    const built = buildWorksheetPlanKey(planKey as PaidWorksheetPlanKey, billingCycle);
    return all.find((p) => p.planKey === built);
  }

  return undefined;
}

export function getWorksheetsIncludedForPlanName(planName: string): number {
  for (const key of pricingPlans.order) {
    if (pricingPlans[key].name === planName) {
      return pricingPlans[key].worksheetsIncluded;
    }
  }
  return pricingPlans.free_2.worksheetsIncluded;
}
