import { getRazorpay, getRazorpayKeyId, verifyRazorpaySignature } from "../razorpayClient";
import { storage } from "../storage";
import { legacyPlanKeyToNewPlan } from "../utils/legacyPlan";
import { pricingPlans, type BillingCycle } from "../config/pricing";
import {
  resolveRazorpayPlan,
  type RazorpayPlanDef,
} from "./plans";

export type CreateOrderResult = {
  orderId: string;
  amount: number;
  currency: string;
  planKey: string;
  planName: string;
  keyId: string;
};

export async function createPaymentOrder(
  userId: number,
  planKey: string,
  billingCycle?: BillingCycle | null,
): Promise<CreateOrderResult> {
  const plan = resolveRazorpayPlan(planKey, billingCycle);
  if (!plan || plan.kind === "legacy") {
    throw new Error("Invalid plan");
  }
  if (plan.amount <= 0) {
    throw new Error("This plan does not require payment");
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: plan.currency,
    receipt: `order_${userId}_${Date.now()}`,
    notes: {
      userId: String(userId),
      planKey: plan.planKey,
      billingCycle: plan.billingCycle ?? "",
      worksheetLimit: String(plan.worksheetsIncluded),
    },
  });

  await storage.createPayment({
    userId,
    planKey: plan.planKey,
    billingCycle: plan.billingCycle,
    amount: plan.amount,
    currency: plan.currency,
    worksheetLimit: plan.worksheetsIncluded,
    razorpayOrderId: order.id,
    status: "pending",
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    planKey: plan.planKey,
    planName: plan.name,
    keyId: getRazorpayKeyId(),
  };
}

export async function activateFreePlan(userId: number) {
  await storage.updateUserPlan(userId, "free", null);
  await storage.updateUserSubscriptionFields(userId, {
    planType: "worksheet",
    planName: pricingPlans.free_2.name,
    billingCycle: null,
  });

  await storage.createPayment({
    userId,
    planKey: "free_2",
    billingCycle: null,
    amount: 0,
    currency: "INR",
    worksheetLimit: pricingPlans.free_2.worksheetsIncluded,
    status: "free",
  });
}

export async function activatePaidPlanFromRazorpay(
  userId: number,
  plan: RazorpayPlanDef,
  razorpayPaymentId: string,
  razorpayOrderId: string,
) {
  const legacy = legacyPlanKeyToNewPlan(plan.planKey);
  const isAnnual = plan.period === "yearly";
  const periodEnd = new Date();
  if (isAnnual) {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else if (plan.period === "monthly") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await storage.updateRazorpayCustomerId(userId, razorpayPaymentId);
  await storage.updateUserPlan(userId, legacy.plan, periodEnd);
  await storage.updateUserSubscriptionFields(userId, {
    planType: legacy.planType,
    planName: legacy.planName,
    billingCycle: legacy.billingCycle,
  });

  await storage.updatePaymentByOrderId(razorpayOrderId, {
    razorpayPaymentId,
    status: "captured",
  });
}

export async function verifyAndActivatePayment(
  userId: number,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) {
  const isValid = verifyRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  );
  if (!isValid) {
    throw new Error("Invalid payment signature");
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.fetch(razorpayOrderId);
  const orderUserId = parseInt((order.notes as Record<string, string>)?.userId || "0", 10);
  if (orderUserId !== userId) {
    throw new Error("Order does not belong to this account");
  }

  const planKey = (order.notes as Record<string, string>)?.planKey;
  if (!planKey) {
    throw new Error("Invalid order: missing plan information");
  }

  const plan = resolveRazorpayPlan(planKey);
  if (!plan || Number(plan.amount) !== Number(order.amount)) {
    throw new Error("Order amount mismatch");
  }

  await activatePaidPlanFromRazorpay(userId, plan, razorpayPaymentId, razorpayOrderId);
  return storage.getUser(userId);
}

export async function activateFromPaidOrder(orderId: string, userId?: number) {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.fetch(orderId);

  if (order.status !== "paid") {
    throw new Error(`Order is not paid. Status: ${order.status}`);
  }

  const planKey = (order.notes as Record<string, string>)?.planKey;
  const orderUserId = parseInt((order.notes as Record<string, string>)?.userId || "0", 10);
  if (userId != null && orderUserId !== userId) {
    throw new Error("Order does not belong to this account");
  }

  const plan = resolveRazorpayPlan(planKey || "");
  if (!plan) {
    throw new Error("Could not determine plan from order");
  }

  const targetUserId = userId ?? orderUserId;
  if (!targetUserId) {
    throw new Error("Missing user on order");
  }

  await activatePaidPlanFromRazorpay(
    targetUserId,
    plan,
    orderId,
    orderId,
  );

  return { user: await storage.getUser(targetUserId), plan };
}
