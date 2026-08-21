import { db } from "./db";
import { users, worksheets, contentUploads, payments, passwordResetTokens, type InsertUser, type User, type InsertWorksheet, type WorksheetResponse, type ContentUpload, type Payment, type PasswordResetToken } from "@shared/schema";
import { eq, and, desc, sql, gte, ilike, or, inArray, lt } from "drizzle-orm";
import { sanitizeJsonStrings, sanitizeRecordStrings } from "./utils/sanitizeText";

export interface AdminUserRow {
  id: number;
  email: string;
  name: string;
  plan: string;
  worksheetsGenerated: number;
  createdAt: Date | null;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobileNumber(mobileNumber: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(data: { email: string; name: string; googleId?: string; facebookId?: string }): Promise<User>;
  linkGoogleId(userId: number, googleId: string): Promise<User>;
  linkFacebookId(userId: number, facebookId: string): Promise<User>;
  updateUserPlan(userId: number, plan: string, expiresAt: Date | null): Promise<User>;
  updateUserSubscriptionFields(
    userId: number,
    fields: {
      planType?: string;
      planName?: string;
      billingCycle?: string | null;
      studentCount?: number | null;
    }
  ): Promise<User>;
  updateRazorpayCustomerId(userId: number, razorpayCustomerId: string): Promise<User>;
  addTopUpWorksheets(userId: number, worksheets: number): Promise<User>;
  updateUserStripeSubscription(userId: number, stripeSubscriptionId: string): Promise<User>;
  incrementWorksheetCount(userId: number): Promise<void>;
  incrementWorksheetCountCapped(userId: number, limit: number | null): Promise<boolean>;
  deleteWorksheet(id: number, userId: number): Promise<boolean>;
  getWorksheet(id: number): Promise<WorksheetResponse | undefined>;
  createWorksheet(worksheet: InsertWorksheet, content: any, userId?: number): Promise<WorksheetResponse>;
  rateWorksheet(id: number, rating: number): Promise<WorksheetResponse>;
  getUserWorksheets(userId: number): Promise<WorksheetResponse[]>;
  getAllUsersAdmin(): Promise<AdminUserRow[]>;
  getWorksheetActivityLast7Days(): Promise<DailyActivity[]>;
  createContentUpload(userId: number, data: { board: string; className: string; subject: string; chapter: string; topic: string; extractedText: string; sourceDescription: string; pageCount: number }): Promise<ContentUpload>;
  getUserContentUploads(userId: number): Promise<ContentUpload[]>;
  getContentUpload(id: number, userId: number): Promise<ContentUpload | undefined>;
  deleteContentUpload(id: number, userId: number): Promise<boolean>;
  searchContentUploads(userId: number, className: string, subject: string, topic?: string): Promise<ContentUpload[]>;
  getContentUploadsByIds(userId: number, ids: number[]): Promise<ContentUpload[]>;
  createPayment(data: {
    userId: number;
    planKey: string;
    billingCycle?: string | null;
    amount: number;
    currency: string;
    worksheetLimit?: number | null;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    status: string;
  }): Promise<Payment>;
  updatePaymentByOrderId(
    razorpayOrderId: string,
    data: { razorpayPaymentId?: string; status?: string },
  ): Promise<Payment | undefined>;
  syncFreePaymentWorksheetLimits(freeLimit: number): Promise<number>;
  getUserByEmailInsensitive(email: string): Promise<User | undefined>;
  createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | undefined>;
  getLatestPasswordResetTokenForUser(userId: number): Promise<PasswordResetToken | undefined>;
  deletePasswordResetTokensForUser(userId: number): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByMobileNumber(mobileNumber: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.mobileNumber, mobileNumber));
  return user;
}

  async getUserByEmailInsensitive(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalized}`);
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.facebookId, facebookId));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async createOAuthUser(data: { email: string; name: string; googleId?: string; facebookId?: string }): Promise<User> {
    const [created] = await db.insert(users).values({
      email: data.email,
      name: data.name,
      password: "",
      googleId: data.googleId || null,
      facebookId: data.facebookId || null,
    }).returning();
    return created;
  }

  async linkGoogleId(userId: number, googleId: string): Promise<User> {
    const [updated] = await db.update(users).set({ googleId }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async linkFacebookId(userId: number, facebookId: string): Promise<User> {
    const [updated] = await db.update(users).set({ facebookId }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async updateUserPlan(userId: number, plan: string, expiresAt: Date | null): Promise<User> {
    const [updated] = await db.update(users)
      .set({ plan, planExpiresAt: expiresAt })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserSubscriptionFields(
    userId: number,
    fields: { planType?: string; planName?: string; billingCycle?: string | null; studentCount?: number | null }
  ): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        ...(fields.planType !== undefined ? { planType: fields.planType } : {}),
        ...(fields.planName !== undefined ? { planName: fields.planName } : {}),
        ...(fields.billingCycle !== undefined ? { billingCycle: fields.billingCycle } : {}),
        ...(fields.studentCount !== undefined ? { studentCount: fields.studentCount } : {}),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateRazorpayCustomerId(userId: number, razorpayCustomerId: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ razorpayCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async addTopUpWorksheets(userId: number, worksheets: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    const [updated] = await db
      .update(users)
      .set({
        topUpWorksheetsBalance: (user.topUpWorksheetsBalance ?? 0) + worksheets,
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserStripeSubscription(userId: number, stripeSubscriptionId: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ stripeSubscriptionId })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async incrementWorksheetCount(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db.update(users)
        .set({ worksheetsGenerated: user.worksheetsGenerated + 1 })
        .where(eq(users.id, userId));
    }
  }

  /**
   * Atomically increments the counter only while worksheetsGenerated < limit.
   * When limit is null the user has no cap and the counter always increments.
   */
  async incrementWorksheetCountCapped(userId: number, limit: number | null): Promise<boolean> {
    if (limit == null) {
      await this.incrementWorksheetCount(userId);
      return true;
    }
    const [updated] = await db
      .update(users)
      .set({ worksheetsGenerated: sql`${users.worksheetsGenerated} + 1` })
      .where(and(eq(users.id, userId), lt(users.worksheetsGenerated, limit)))
      .returning({ id: users.id });
    return !!updated;
  }

  async deleteWorksheet(id: number, userId: number): Promise<boolean> {
    const deleted = await db
      .delete(worksheets)
      .where(and(eq(worksheets.id, id), eq(worksheets.userId, userId)))
      .returning({ id: worksheets.id });
    return deleted.length > 0;
  }

  async getWorksheet(id: number): Promise<WorksheetResponse | undefined> {
    const [worksheet] = await db.select().from(worksheets).where(eq(worksheets.id, id));
    return worksheet;
  }

  async createWorksheet(worksheet: InsertWorksheet, content: any, userId?: number): Promise<WorksheetResponse> {
    const sanitizedWorksheet = sanitizeRecordStrings(worksheet as unknown as Record<string, unknown>) as InsertWorksheet;
    const sanitizedContent = sanitizeJsonStrings(content);
    if (process.env.DEBUG_SANITIZE_TEXT === "1") {
      try {
        const beforeLen = JSON.stringify(content ?? {}).length;
        const afterLen = JSON.stringify(sanitizedContent ?? {}).length;
        if (beforeLen !== afterLen) {
          console.log("[sanitize] Worksheet content sanitized", { beforeLen, afterLen });
        }
      } catch {
        // ignore JSON stringify issues for debug logging
      }
    }

    const board = (worksheet.board || "GEN").toUpperCase().replace(/\s+/g, '');
    const subjectWords = (worksheet.subject || "SUB").trim().split(/\s+/);
    const subjectInitials = subjectWords.length === 1
      ? subjectWords[0].slice(0, 3).toUpperCase()
      : subjectWords.map(w => w[0]).join('').toUpperCase().slice(0, 4);
    const chapterRaw = worksheet.chapter || worksheet.topic || "GENERAL";
    const chapterSlug = chapterRaw
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');

    const matchPattern = `${board}-${subjectInitials}-${chapterSlug}-%`;
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(worksheets)
      .where(sql`${worksheets.serialNumber} LIKE ${matchPattern}`);
    const seqNum = Number(countResult[0]?.count || 0) + 1;
    const serialNumber = `${board}-${subjectInitials}-${chapterSlug}-${String(seqNum).padStart(3, '0')}`;

    const [created] = await db.insert(worksheets).values({
      ...sanitizedWorksheet,
      content: sanitizedContent,
      userId: userId || null,
      serialNumber,
    }).returning();
    return created;
  }

  async rateWorksheet(id: number, rating: number): Promise<WorksheetResponse> {
    const [updated] = await db.update(worksheets)
      .set({ rating })
      .where(eq(worksheets.id, id))
      .returning();
    return updated;
  }

  async getUserWorksheets(userId: number): Promise<WorksheetResponse[]> {
    return db.select().from(worksheets).where(eq(worksheets.userId, userId)).orderBy(desc(worksheets.createdAt));
  }

  async getAllUsersAdmin(): Promise<AdminUserRow[]> {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        worksheetsGenerated: users.worksheetsGenerated,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return rows;
  }

  async getWorksheetActivityLast7Days(): Promise<DailyActivity[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        date: sql<string>`DATE(${worksheets.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(worksheets)
      .where(gte(worksheets.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(${worksheets.createdAt})`)
      .orderBy(sql`DATE(${worksheets.createdAt})`);

    const dateMap = new Map(rows.map((r) => [r.date, r.count]));
    const result: DailyActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push({ date: key, count: dateMap.get(key) || 0 });
    }
    return result;
  }

  async createContentUpload(userId: number, data: { board: string; className: string; subject: string; chapter: string; topic: string; extractedText: string; sourceDescription: string; pageCount: number }): Promise<ContentUpload> {
    const [created] = await db.insert(contentUploads).values({
      userId,
      board: data.board,
      className: data.className,
      subject: data.subject,
      chapter: data.chapter,
      topic: data.topic,
      extractedText: data.extractedText,
      sourceDescription: data.sourceDescription,
      pageCount: data.pageCount,
    }).returning();
    return created;
  }

  async getUserContentUploads(userId: number): Promise<ContentUpload[]> {
    return db.select().from(contentUploads)
      .where(eq(contentUploads.userId, userId))
      .orderBy(desc(contentUploads.createdAt));
  }

  async getContentUpload(id: number, userId: number): Promise<ContentUpload | undefined> {
    const [row] = await db.select().from(contentUploads)
      .where(and(eq(contentUploads.id, id), eq(contentUploads.userId, userId)));
    return row;
  }

  async deleteContentUpload(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(contentUploads)
      .where(and(eq(contentUploads.id, id), eq(contentUploads.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getContentUploadsByIds(userId: number, ids: number[]): Promise<ContentUpload[]> {
    if (ids.length === 0) return [];
    return db.select().from(contentUploads)
      .where(and(
        eq(contentUploads.userId, userId),
        inArray(contentUploads.id, ids)
      ));
  }

  async createPayment(data: {
    userId: number;
    planKey: string;
    billingCycle?: string | null;
    amount: number;
    currency: string;
    worksheetLimit?: number | null;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    status: string;
  }): Promise<Payment> {
    const [created] = await db.insert(payments).values({
      userId: data.userId,
      planKey: data.planKey,
      billingCycle: data.billingCycle ?? null,
      amount: data.amount,
      currency: data.currency,
      worksheetLimit: data.worksheetLimit ?? null,
      razorpayOrderId: data.razorpayOrderId ?? null,
      razorpayPaymentId: data.razorpayPaymentId ?? null,
      status: data.status,
    }).returning();
    return created;
  }

  async updatePaymentByOrderId(
    razorpayOrderId: string,
    data: { razorpayPaymentId?: string; status?: string },
  ): Promise<Payment | undefined> {
    const [updated] = await db
      .update(payments)
      .set({
        ...(data.razorpayPaymentId !== undefined ? { razorpayPaymentId: data.razorpayPaymentId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      })
      .where(eq(payments.razorpayOrderId, razorpayOrderId))
      .returning();
    return updated;
  }

  async syncFreePaymentWorksheetLimits(freeLimit: number): Promise<number> {
    const updated = await db
      .update(payments)
      .set({ worksheetLimit: freeLimit })
      .where(
        and(
          eq(payments.planKey, "free_2"),
          or(eq(payments.status, "free"), eq(payments.amount, 0)),
          or(sql`${payments.worksheetLimit} IS NULL`, lt(payments.worksheetLimit, freeLimit)),
        ),
      )
      .returning({ id: payments.id });
    return updated.length;
  }

  async searchContentUploads(userId: number, className: string, subject: string, topic?: string): Promise<ContentUpload[]> {
    const conditions = [
      eq(contentUploads.userId, userId),
      ilike(contentUploads.className, `%${className}%`),
      ilike(contentUploads.subject, `%${subject}%`),
    ];
    if (topic) {
      conditions.push(
        or(
          ilike(contentUploads.topic, `%${topic}%`),
          ilike(contentUploads.chapter, `%${topic}%`)
        ) as any
      );
    }
    return db.select().from(contentUploads)
      .where(and(...conditions))
      .orderBy(desc(contentUploads.createdAt))
      .limit(3);
  }

  async createPasswordResetToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const [created] = await db
      .insert(passwordResetTokens)
      .values({ userId, tokenHash, expiresAt })
      .returning();
    return created;
  }

  async getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | undefined> {
    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash));
    return record;
  }

  async getLatestPasswordResetTokenForUser(userId: number): Promise<PasswordResetToken | undefined> {
    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId))
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(1);
    return record;
  }

  async deletePasswordResetTokensForUser(userId: number): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
