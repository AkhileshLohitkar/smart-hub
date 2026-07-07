import { pgTable, text, serial, integer, json, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const USER_ROLES = ["Student", "Parent", "Teacher", "Professional"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull().default(""),
  name: text("name").notNull(),
  mobileNumber: text("mobile_number").notNull().default(""),
  role: text("role"),
  userCategory: text("user_category"),
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
  plan: text("plan").notNull().default("free"),
  planType: text("plan_type").notNull().default("worksheet"),
  planName: text("plan_name").notNull().default("Free"),
  billingCycle: text("billing_cycle"),
  // Legacy field (old per-student pricing). Kept for backward compatibility with existing DB rows.
  studentCount: integer("student_count"),
  planExpiresAt: timestamp("plan_expires_at"),
  worksheetsGenerated: integer("worksheets_generated").notNull().default(0),
  topUpWorksheetsBalance: integer("top_up_worksheets_balance").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  lastLoginAt: timestamp("last_login_at"),
  lastLogoutAt: timestamp("last_logout_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const worksheets = pgTable("worksheets", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number"),
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

export const contentUploads = pgTable("content_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  board: text("board").notNull(),
  className: text("class_name").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter").notNull().default(""),
  topic: text("topic").notNull().default(""),
  extractedText: text("extracted_text").notNull(),
  sourceDescription: text("source_description").default(""),
  pageCount: integer("page_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planKey: text("plan_key").notNull(),
  billingCycle: text("billing_cycle"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  worksheetLimit: integer("worksheet_limit"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const brainflexWorksheets = pgTable("brainflex_worksheets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  className: text("class_name").notNull(),
  board: text("board").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter").notNull().default(""),
  difficulty: text("difficulty").notNull(),
  puzzleTypes: jsonb("puzzle_types").notNull().$type<string[]>(),
  generatedContent: jsonb("generated_content").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Replit chat integrations (optional feature).
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContentUploadSchema = createInsertSchema(contentUploads).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export type Payment = typeof payments.$inferSelect;
export type ContentUpload = typeof contentUploads.$inferSelect;
export type InsertContentUpload = z.infer<typeof insertContentUploadSchema>;
export type BrainflexWorksheet = typeof brainflexWorksheets.$inferSelect;

export const USER_ACTIVITY_ACTION_TYPES = [
  "LOGIN",
  "LOGOUT",
  "GENERATE_WORKSHEET",
  "DOWNLOAD_WORKSHEET",
] as const;

export type UserActivityActionType = (typeof USER_ACTIVITY_ACTION_TYPES)[number];

export const userActivityLogs = pgTable(
  "user_activity_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    actionType: text("action_type").notNull(),
    worksheetId: integer("worksheet_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("user_activity_logs_user_id_idx").on(t.userId),
    createdAtIdx: index("user_activity_logs_created_at_idx").on(t.createdAt),
    userIdCreatedAtIdx: index("user_activity_logs_user_id_created_at_idx").on(t.userId, t.createdAt),
  }),
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    userIdIdx: index("password_reset_tokens_user_id_idx").on(t.userId),
    expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(t.expiresAt),
  }),
);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  worksheetsGenerated: true,
  plan: true,
  planExpiresAt: true,
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
  role: z.enum(USER_ROLES, { message: "Please select your role." }),
  mobile: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string().min(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^[0-9]{6}$/, "OTP must be 6 digits"),
  password: z.string().min(6),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Worksheet = typeof worksheets.$inferSelect;
export type InsertWorksheet = z.infer<typeof insertWorksheetSchema>;

// Worksheet watermark settings (stored inside the worksheet `content` JSON, so no
// schema migration is required). `mode: "default"` preserves the existing Qik
// Worksheets watermark behaviour exactly.
export const WATERMARK_MIN_SIZE = 25;
export const WATERMARK_MAX_SIZE = 100;

export type WorksheetWatermark = {
  mode: "default" | "custom";
  text?: string;
  logo?: string; // data URL (PNG/JPG/JPEG/SVG) for a custom logo watermark
  size: number; // percentage between WATERMARK_MIN_SIZE and WATERMARK_MAX_SIZE
};

export function normalizeWatermark(input: unknown): WorksheetWatermark | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (raw.mode !== "custom") return null;
  const text = typeof raw.text === "string" ? raw.text.trim().slice(0, 120) : "";
  const logo = typeof raw.logo === "string" ? raw.logo : "";
  const hasLogo = logo.startsWith("data:image/");
  if (!text && !hasLogo) return null;
  const rawSize = Number(raw.size);
  const size = Number.isFinite(rawSize)
    ? Math.min(WATERMARK_MAX_SIZE, Math.max(WATERMARK_MIN_SIZE, Math.round(rawSize)))
    : WATERMARK_MAX_SIZE;
  return { mode: "custom", text, logo: hasLogo ? logo : "", size };
}

export type GenerateWorksheetRequest = InsertWorksheet;
export type WorksheetResponse = Worksheet;
