export const PLAN_CONFIG: Record<string, { plan: string; maxChildren: number }> = {
  starter_monthly: { plan: "starter", maxChildren: 1 },
  starter_annual: { plan: "starter_annual", maxChildren: 1 },
  family_monthly: { plan: "family", maxChildren: 3 },
  family_annual: { plan: "family_annual", maxChildren: 3 },
  no_watermark: { plan: "no_watermark", maxChildren: 10 },
};
