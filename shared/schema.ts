import { pgTable, text, serial, integer, json, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  planExpiresAt: timestamp("plan_expires_at"),
  maxChildren: integer("max_children").notNull().default(1),
  worksheetsGenerated: integer("worksheets_generated").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  board: text("board").notNull(),
  className: text("class_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const worksheets = pgTable("worksheets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  className: text("class_name").notNull(),
  board: text("board").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter"),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  length: integer("length").notNull().default(10),
  colorMode: text("color_mode").notNull().default("bw"),
  worksheetType: text("worksheet_type").notNull().default("worksheet"),
  content: json("content").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  worksheetsGenerated: true,
  plan: true,
  planExpiresAt: true,
  maxChildren: true,
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertWorksheetSchema = createInsertSchema(worksheets).omit({
  id: true,
  createdAt: true,
  content: true,
  rating: true,
  userId: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Worksheet = typeof worksheets.$inferSelect;
export type InsertWorksheet = z.infer<typeof insertWorksheetSchema>;

export type GenerateWorksheetRequest = InsertWorksheet;
export type WorksheetResponse = Worksheet;
