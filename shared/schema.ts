import { pgTable, text, serial, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const worksheets = pgTable("worksheets", {
  id: serial("id").primaryKey(),
  className: text("class_name").notNull(),
  board: text("board").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter"),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  length: integer("length").notNull().default(10),
  colorMode: text("color_mode").notNull().default("bw"),
  content: json("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorksheetSchema = createInsertSchema(worksheets).omit({ 
  id: true, 
  createdAt: true,
  content: true 
});

export type Worksheet = typeof worksheets.$inferSelect;
export type InsertWorksheet = z.infer<typeof insertWorksheetSchema>;

export type GenerateWorksheetRequest = InsertWorksheet;
export type WorksheetResponse = Worksheet;
