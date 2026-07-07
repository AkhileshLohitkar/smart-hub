/**
 * Single source of truth for all Qik Worksheets pricing.
 * Server, client, and API must import from here — never duplicate plan data elsewhere.
 */

export const FREE_PLAN_WORKSHEETS_INCLUDED = 3;
export const YEARLY_DISCOUNT_PERCENT = 25;
export const MONTHS_PER_YEAR = 12;

export type BillingCycle = "monthly" | "yearly";
export type PlanType = "worksheet";
export type PlanCategory = "free" | "parents" | "professional";
export type WorksheetPlanKey = "free_2" | "w50" | "w100" | "w200" | "w400";
export type PaidWorksheetPlanKey = Exclude<WorksheetPlanKey, "free_2">;
export type TopUpPlanKey = "topup_10" | "topup_20" | "topup_50";

export type PricingPlanDef = {
  key: WorksheetPlanKey;
  name: string;
  /** Monthly quota for paid plans; total quota for free plan. */
  worksheetsIncluded: number;
  monthlyPrice: number;
  yearlyPrice: number | null;
  yearlyDiscountedPrice: number | null;
  category: PlanCategory;
  description: string;
  badgeLabel?: string;
  popular?: boolean;
  highlighted?: boolean;
  noWatermark: boolean;
  supportLevel: "basic" | "priority";
};

export type TopUpPlanDef = {
  key: TopUpPlanKey;
  worksheets: number;
  price: number;
};

export type PricingSectionDef = {
  id: "parents" | "professionals";
  title: string;
  subtitle: string;
  planKeys: WorksheetPlanKey[];
};

export const PRICING_PLANS = {
  free_2: {
    key: "free_2",
    name: "Free",
    worksheetsIncluded: FREE_PLAN_WORKSHEETS_INCLUDED,
    monthlyPrice: 0,
    yearlyPrice: null,
    yearlyDiscountedPrice: null,
    category: "free",
    description: "Perfect to try Qik Worksheets",
    badgeLabel: "Free",
    noWatermark: false,
    supportLevel: "basic",
  },
  w50: {
    key: "w50",
    name: "Starter",
    worksheetsIncluded: 30,
    monthlyPrice: 299,
    yearlyPrice: 3588,
    yearlyDiscountedPrice: 2691,
    category: "parents",
    description: "Great for regular practice at home",
    badgeLabel: "Starter",
    noWatermark: true,
    supportLevel: "priority",
  },
  w100: {
    key: "w100",
    name: "Growth",
    worksheetsIncluded: 75,
    monthlyPrice: 499,
    yearlyPrice: 5988,
    yearlyDiscountedPrice: 4491,
    category: "parents",
    description: "Best value for active learners",
    badgeLabel: "Most Popular",
    popular: true,
    highlighted: true,
    noWatermark: true,
    supportLevel: "priority",
  },
  w200: {
    key: "w200",
    name: "Starter Pro",
    worksheetsIncluded: 200,
    monthlyPrice: 599,
    yearlyPrice: 7188,
    yearlyDiscountedPrice: 5391,
    category: "professional",
    description: "For tutors and small classrooms",
    noWatermark: true,
    supportLevel: "priority",
  },
  w400: {
    key: "w400",
    name: "Growth Pro",
    worksheetsIncluded: 500,
    monthlyPrice: 1499,
    yearlyPrice: 17988,
    yearlyDiscountedPrice: 13491,
    category: "professional",
    description: "Maximum volume for professionals",
    badgeLabel: "Best Value",
    highlighted: true,
    noWatermark: true,
    supportLevel: "priority",
  },
} as const satisfies Record<WorksheetPlanKey, PricingPlanDef>;

export const PRICING_PLANS_MAP: Record<WorksheetPlanKey, PricingPlanDef> = PRICING_PLANS;

export const PRICING_PLAN_ORDER = [
  "free_2",
  "w50",
  "w100",
  "w200",
  "w400",
] as const satisfies readonly WorksheetPlanKey[];

export const TOP_UP_PLANS = {
  topup_10: { key: "topup_10", worksheets: 10, price: 99 },
  topup_20: { key: "topup_20", worksheets: 20, price: 189 },
  topup_50: { key: "topup_50", worksheets: 50, price: 399 },
} as const satisfies Record<TopUpPlanKey, TopUpPlanDef>;

export const TOP_UP_PLAN_ORDER = [
  "topup_10",
  "topup_20",
  "topup_50",
] as const satisfies readonly TopUpPlanKey[];

export const PRICING_SECTIONS: PricingSectionDef[] = [
  {
    id: "parents",
    title: "Parents",
    subtitle: "Affordable plans for home learning and practice",
    planKeys: ["free_2", "w50", "w100"],
  },
  {
    id: "professionals",
    title: "Professionals",
    subtitle: "Higher volume plans for tutors, teachers, and institutions",
    planKeys: ["w200", "w400"],
  },
];

/** Legacy plan display names → worksheet limits for existing subscribers. */
const LEGACY_PLAN_WORKSHEET_LIMITS: Record<string, number> = {
  "50 worksheets": PRICING_PLANS.w50.worksheetsIncluded,
  "100 worksheets": PRICING_PLANS.w100.worksheetsIncluded,
  "200 worksheets": PRICING_PLANS.w200.worksheetsIncluded,
  "400 worksheets": PRICING_PLANS.w400.worksheetsIncluded,
};

export function getYearlyWorksheetTotal(monthlyIncluded: number): number {
  return monthlyIncluded * MONTHS_PER_YEAR;
}

export function getPlan(key: WorksheetPlanKey): PricingPlanDef {
  return PRICING_PLANS_MAP[key];
}

export function getPaidPlan(key: PaidWorksheetPlanKey): PricingPlanDef {
  return PRICING_PLANS_MAP[key];
}

export function getTopUpPlan(key: TopUpPlanKey): TopUpPlanDef {
  return TOP_UP_PLANS[key];
}

export function getTopUpPlanList(): TopUpPlanDef[] {
  return TOP_UP_PLAN_ORDER.map((key) => TOP_UP_PLANS[key]);
}

export function getPlanAmountInr(
  planKey: PaidWorksheetPlanKey,
  billingCycle: BillingCycle,
): number {
  const plan = getPaidPlan(planKey);
  if (billingCycle === "monthly") return plan.monthlyPrice;
  return plan.yearlyDiscountedPrice ?? plan.yearlyPrice ?? plan.monthlyPrice * MONTHS_PER_YEAR;
}

export function getWorksheetLimitForPlanName(planName: string | null | undefined): number | null {
  const normalized = (planName || "").trim().toLowerCase();
  if (!normalized || normalized === "free" || normalized === "basic") {
    return FREE_PLAN_WORKSHEETS_INCLUDED;
  }
  for (const key of PRICING_PLAN_ORDER) {
    if (PRICING_PLANS[key].name.toLowerCase() === normalized) {
      return PRICING_PLANS[key].worksheetsIncluded;
    }
  }
  return LEGACY_PLAN_WORKSHEET_LIMITS[normalized] ?? null;
}

export function getPlanFeatures(
  planKey: WorksheetPlanKey,
  cycle: BillingCycle | "free",
): string[] {
  const plan = PRICING_PLANS_MAP[planKey];
  if (plan.category === "free") {
    return [
      `${plan.worksheetsIncluded} worksheets`,
      "Watermark enabled",
      "Print & Download",
      "Basic Support",
    ];
  }

  const count =
    cycle === "yearly"
      ? getYearlyWorksheetTotal(plan.worksheetsIncluded)
      : plan.worksheetsIncluded;
  const period = cycle === "yearly" ? "Year" : "Month";
  const worksheetLine = `${count} Worksheets / ${period}`;

  const commonFeatures = [
    "All Your Children",
    "Nursery to Grade 10",
    "Default Qik Worksheets Watermark",
    "Custom Watermark (Logo or Text)",
    "Print & Download PDF",
    "QR Code Answer Key",
    "AI Question Generation",
    "CBSE & State Board Support",
  ];

  switch (planKey) {
    case "w50":
      return [worksheetLine, ...commonFeatures, "Priority Support"];
    case "w100":
      return [
        worksheetLine,
        ...commonFeatures,
        "Brain Flex Puzzles",
        "Test Prep Generator",
        "Priority Support",
      ];
    case "w200":
      return [
        worksheetLine,
        ...commonFeatures,
        "Brain Flex Puzzles",
        "Test Prep Generator",
        "Question Paper Studio",
        "Priority Support",
      ];
    case "w400":
      return [
        worksheetLine,
        ...commonFeatures,
        "Brain Flex Puzzles",
        "Test Prep Generator",
        "Question Paper Studio",
        "Premium Priority Support",
      ];
    default:
      return [worksheetLine, ...commonFeatures, "Priority Support"];
  }
}

export function getWorksheetLabel(planKey: WorksheetPlanKey, cycle: BillingCycle | "free"): string {
  const plan = PRICING_PLANS_MAP[planKey];
  if (plan.category === "free") {
    return `${plan.worksheetsIncluded} Worksheets`;
  }
  if (cycle === "yearly") {
    return `${getYearlyWorksheetTotal(plan.worksheetsIncluded)} Worksheets / Year`;
  }
  return `${plan.worksheetsIncluded} Worksheets / Month`;
}

/** Shape returned by GET /api/pricing */
export function buildPricingApiPayload() {
  return {
    ...PRICING_PLANS,
    order: PRICING_PLAN_ORDER,
    topUpPlans: {
      ...TOP_UP_PLANS,
      order: TOP_UP_PLAN_ORDER,
    },
  };
}
