import crypto from "node:crypto";
import { storage } from "../storage";
import { hashPassword } from "../utils/password";
import type { User, UserRole } from "@shared/schema";

const WHATSAPP_ROLES: UserRole[] = ["Parent", "Teacher"];

function normalizeMobileNumber(mobileNumber: string): string {
  const digits = mobileNumber.replace(/\D/g, "");

  // Support Indian WhatsApp numbers such as:
  // +91XXXXXXXXXX
  // 91XXXXXXXXXX
  // XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}

export async function resolveWhatsAppUser(
  mobileNumber: string,
  role: UserRole,
): Promise<User> {
  const normalizedMobile = normalizeMobileNumber(mobileNumber);

  if (!/^\d{10}$/.test(normalizedMobile)) {
    throw new Error("Invalid WhatsApp mobile number");
  }

  if (!WHATSAPP_ROLES.includes(role)) {
    throw new Error("Invalid WhatsApp user role");
  }

  const existingUser = await storage.getUserByMobileNumber(normalizedMobile);

  if (existingUser) {
    return existingUser;
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await hashPassword(randomPassword);

  const email = `wa_${normalizedMobile}@qikworksheet.internal`;
  const name = role === "Parent" ? "WhatsApp Parent" : "WhatsApp Teacher";

  return storage.createUser({
    email,
    name,
    password: hashedPassword,
    mobileNumber: normalizedMobile,
    role,
  });
}