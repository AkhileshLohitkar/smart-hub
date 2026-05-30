// Stripe subscription -> internal plan mapping (legacy keys for existing webhooks).
export const PLAN_CONFIG: Record<string, { plan: string }> = {
  w50_monthly: { plan: "paid" },
  w50_yearly: { plan: "paid" },
  w100_monthly: { plan: "paid" },
  w100_yearly: { plan: "paid" },
  w200_monthly: { plan: "paid" },
  w200_yearly: { plan: "paid" },
  w400_monthly: { plan: "paid" },
  w400_yearly: { plan: "paid" },
  starter_monthly: { plan: "starter" },
  starter_annual: { plan: "starter_annual" },
  family_monthly: { plan: "family" },
  family_annual: { plan: "family_annual" },
  no_watermark: { plan: "no_watermark" },
};
