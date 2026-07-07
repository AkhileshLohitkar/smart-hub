import { storage } from "../storage";
import {
  FREE_WORKSHEET_LIMIT_MESSAGE,
  getWorksheetLimitForUser,
  hasUserReachedWorksheetLimit,
} from "../config/pricing";

export type WorksheetQuotaError = { status: 403; message: string };

/** Fast pre-check before expensive AI generation. */
export async function ensureWorksheetQuota(userId: number): Promise<WorksheetQuotaError | null> {
  const user = await storage.getUser(userId);
  if (!user) {
    return { status: 403, message: FREE_WORKSHEET_LIMIT_MESSAGE };
  }
  if (hasUserReachedWorksheetLimit(user)) {
    return { status: 403, message: FREE_WORKSHEET_LIMIT_MESSAGE };
  }
  return null;
}

/**
 * Records a successful worksheet after DB insert.
 * Uses an atomic capped increment so the counter never exceeds the plan limit.
 * Rolls back the worksheet row when the limit would be exceeded (race / concurrent requests).
 */
export async function recordWorksheetGeneration(
  userId: number,
  worksheetId: number,
): Promise<WorksheetQuotaError | null> {
  const user = await storage.getUser(userId);
  const limit = getWorksheetLimitForUser(user);
  const ok = await storage.incrementWorksheetCountCapped(userId, limit);
  if (!ok) {
    await storage.deleteWorksheet(worksheetId, userId);
    return { status: 403, message: FREE_WORKSHEET_LIMIT_MESSAGE };
  }
  return null;
}
