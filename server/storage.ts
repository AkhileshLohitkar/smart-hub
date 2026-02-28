import { db } from "./db";
import { users, children, worksheets, type InsertUser, type User, type InsertChild, type Child, type InsertWorksheet, type WorksheetResponse } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPlan(userId: number, plan: string, maxChildren: number, expiresAt: Date | null): Promise<User>;
  updateRazorpayCustomerId(userId: number, razorpayCustomerId: string): Promise<User>;
  incrementWorksheetCount(userId: number): Promise<void>;
  getChildren(userId: number): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(child: InsertChild, userId: number): Promise<Child>;
  deleteChild(id: number, userId: number): Promise<boolean>;
  getWorksheet(id: number): Promise<WorksheetResponse | undefined>;
  createWorksheet(worksheet: InsertWorksheet, content: any, userId?: number): Promise<WorksheetResponse>;
  rateWorksheet(id: number, rating: number): Promise<WorksheetResponse>;
  getUserWorksheets(userId: number): Promise<WorksheetResponse[]>;
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

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserPlan(userId: number, plan: string, maxChildren: number, expiresAt: Date | null): Promise<User> {
    const [updated] = await db.update(users)
      .set({ plan, maxChildren, planExpiresAt: expiresAt })
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

  async incrementWorksheetCount(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db.update(users)
        .set({ worksheetsGenerated: user.worksheetsGenerated + 1 })
        .where(eq(users.id, userId));
    }
  }

  async getChildren(userId: number): Promise<Child[]> {
    return db.select().from(children).where(eq(children.userId, userId));
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(child: InsertChild, userId: number): Promise<Child> {
    const [created] = await db.insert(children).values({ ...child, userId }).returning();
    return created;
  }

  async deleteChild(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(children)
      .where(and(eq(children.id, id), eq(children.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getWorksheet(id: number): Promise<WorksheetResponse | undefined> {
    const [worksheet] = await db.select().from(worksheets).where(eq(worksheets.id, id));
    return worksheet;
  }

  async createWorksheet(worksheet: InsertWorksheet, content: any, userId?: number): Promise<WorksheetResponse> {
    const [created] = await db.insert(worksheets).values({
      ...worksheet,
      content,
      userId: userId || null,
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
}

export const storage = new DatabaseStorage();
