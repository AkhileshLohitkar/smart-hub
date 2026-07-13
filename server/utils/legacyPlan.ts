import {
  getSubscriptionPlanName,
  type BillingCycle,
  type PlanType,
} from "../config/pricing";

export type LegacyPlanUpdate = {
  plan: string;
  planType: PlanType;
  planName: string;
  billingCycle: BillingCycle | null;
};

export function legacyPlanKeyToNewPlan(planKey: string): LegacyPlanUpdate {
  const fallback: LegacyPlanUpdate = {
    plan: "paid",
    planType: "worksheet",
    planName: getSubscriptionPlanName("w50", "monthly"),
    billingCycle: "monthly",
  };

  switch (planKey) {
    case "w50_monthly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w50", "monthly"),
        billingCycle: "monthly",
      };
    case "w50_yearly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w50", "yearly"),
        billingCycle: "yearly",
      };
    case "w100_monthly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w100", "monthly"),
        billingCycle: "monthly",
      };
    case "w100_yearly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w100", "yearly"),
        billingCycle: "yearly",
      };
    case "w200_monthly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w200", "monthly"),
        billingCycle: "monthly",
      };
    case "w200_yearly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w200", "yearly"),
        billingCycle: "yearly",
      };
    case "w400_monthly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w400", "monthly"),
        billingCycle: "monthly",
      };
    case "w400_yearly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w400", "yearly"),
        billingCycle: "yearly",
      };
    case "w50_topup":
    case "w100_topup":
    case "w200_topup":
    case "w400_topup":
    case "topup_10":
    case "topup_20":
    case "topup_50":
      return fallback;
    case "starter_monthly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w50", "monthly"),
        billingCycle: "monthly",
      };
    case "starter_annual":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w50", "yearly"),
        billingCycle: "yearly",
      };
    case "family_monthly":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w100", "monthly"),
        billingCycle: "monthly",
      };
    case "family_annual":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w100", "yearly"),
        billingCycle: "yearly",
      };
    case "no_watermark":
      return {
        plan: "paid",
        planType: "worksheet",
        planName: getSubscriptionPlanName("w200", "yearly"),
        billingCycle: "yearly",
      };
    default:
      return fallback;
  }
}
