import { FREE_PLAN_WORKSHEETS_INCLUDED } from "@shared/worksheetLimits";

/** Worksheet limits by plan display name (mirrors server pricing config). */
const WORKSHEET_LIMIT_BY_PLAN_NAME: Record<string, number> = {
  Free: FREE_PLAN_WORKSHEETS_INCLUDED,
  Basic: FREE_PLAN_WORKSHEETS_INCLUDED,
  "50 Worksheets": 50,
  "100 Worksheets": 100,
  "200 Worksheets": 200,
  "400 Worksheets": 400,
};

export type ProfilePlanInfo = {
  displayName: string;
  status: "Active" | "Free" | "Expired";
  expiresLabel: string | null;
  worksheetsIncluded: number;
  worksheetsUsed: number;
  worksheetsLeft: number | null;
  isFree: boolean;
};

export function getProfilePlanInfo(user: {
  plan?: string | null;
  planName?: string | null;
  planExpiresAt?: string | Date | null;
  worksheetsGenerated?: number | null;
}): ProfilePlanInfo {
  const used = user.worksheetsGenerated ?? 0;
  const planName = (user.planName || "").trim();
  const isFree =
    user.plan === "free" ||
    !planName ||
    ["free", "basic"].includes(planName.toLowerCase());

  const displayName = isFree ? "Free" : planName || "Paid";
  const worksheetsIncluded = isFree
    ? FREE_PLAN_WORKSHEETS_INCLUDED
    : WORKSHEET_LIMIT_BY_PLAN_NAME[planName] ?? 50;

  let status: ProfilePlanInfo["status"] = isFree ? "Free" : "Active";
  let expiresLabel: string | null = null;

  if (user.planExpiresAt) {
    const exp = new Date(user.planExpiresAt);
    if (!Number.isNaN(exp.getTime())) {
      expiresLabel = exp.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      if (!isFree && exp < new Date()) {
        status = "Expired";
      }
    }
  }

  const worksheetsLeft = isFree
    ? Math.max(0, worksheetsIncluded - used)
    : status === "Active"
      ? Math.max(0, worksheetsIncluded - used)
      : null;

  return {
    displayName,
    status,
    expiresLabel,
    worksheetsIncluded,
    worksheetsUsed: used,
    worksheetsLeft,
    isFree,
  };
}
