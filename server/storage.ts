import { db } from "./db";
import { worksheets, type InsertWorksheet, type WorksheetResponse } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getWorksheet(id: number): Promise<WorksheetResponse | undefined>;
  createWorksheet(worksheet: InsertWorksheet, content: any): Promise<WorksheetResponse>;
}

export class DatabaseStorage implements IStorage {
  async getWorksheet(id: number): Promise<WorksheetResponse | undefined> {
    const [worksheet] = await db.select().from(worksheets).where(eq(worksheets.id, id));
    return worksheet;
  }

  async createWorksheet(worksheet: InsertWorksheet, content: any): Promise<WorksheetResponse> {
    const [created] = await db.insert(worksheets).values({
      ...worksheet,
      content,
    }).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
