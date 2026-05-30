import { db } from "../db";
import { userActivityLogs, type UserActivityActionType, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export type UserActivityMetadata = Record<string, unknown>;

export async function logUserActivity(
  userId: number,
  actionType: UserActivityActionType,
  worksheetId?: number | null,
  metadata?: UserActivityMetadata | null,
): Promise<void> {
  // Logging should never break the primary request path.
  try {
    await db.insert(userActivityLogs).values({
      userId,
      actionType,
      worksheetId: worksheetId ?? null,
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("[activity] Failed to log user activity:", err);
  }
}

export async function touchLastLoginAt(userId: number, at = new Date()): Promise<void> {
  try {
    await db.update(users).set({ lastLoginAt: at }).where(eq(users.id, userId));
  } catch (err) {
    console.error("[activity] Failed to update last_login_at:", err);
  }
}

export async function touchLastLogoutAt(userId: number, at = new Date()): Promise<void> {
  try {
    await db.update(users).set({ lastLogoutAt: at }).where(eq(users.id, userId));
  } catch (err) {
    console.error("[activity] Failed to update last_logout_at:", err);
  }
}

