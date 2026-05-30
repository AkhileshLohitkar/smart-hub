import type { Express } from "express";
import { z } from "zod";
import { getRazorpayKeyId, verifyWebhookSignature } from "../razorpayClient";
import { storage } from "../storage";
import {
  activateFreePlan,
  activateFromPaidOrder,
  createPaymentOrder,
  verifyAndActivatePayment,
} from "./service";
import { buildPublicRazorpayPlans, getAllRazorpayPlans, resolveRazorpayPlan } from "./plans";
import { getRazorpay } from "../razorpayClient";
import { legacyPlanKeyToNewPlan } from "../utils/legacyPlan";

const createOrderSchema = z.object({
  planKey: z.string().min(1),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export function registerPaymentRoutes(app: Express) {
  const publicPlans = buildPublicRazorpayPlans();
  const allPlans = getAllRazorpayPlans();

  app.get("/api/razorpay/key", (_req, res) => {
    try {
      res.json({ keyId: getRazorpayKeyId() });
    } catch {
      res.status(500).json({ message: "Razorpay not configured" });
    }
  });

  app.get("/api/razorpay/plans", (_req, res) => {
    res.json({ plans: publicPlans });
  });

  const handleCreateOrder = async (req: any, res: any) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to subscribe" });
      }

      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "planKey and billingCycle are required" });
      }

      const { planKey, billingCycle } = parsed.data;
      const result = await createPaymentOrder(req.user.id, planKey, billingCycle);
      res.json({
        orderId: result.orderId,
        amount: result.amount,
        currency: result.currency,
        planKey: result.planKey,
        planName: result.planName,
        keyId: result.keyId,
      });
    } catch (err: any) {
      console.error("Create order error:", err);
      res.status(500).json({ message: err.message || "Failed to create order" });
    }
  };

  app.post("/api/payments/create-order", handleCreateOrder);
  app.post("/api/razorpay/create-order", handleCreateOrder);

  const handleVerifyPayment = async (req: any, res: any) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const parsed = verifyPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Missing payment details" });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
      const updatedUser = await verifyAndActivatePayment(
        req.user.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      );

      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      console.error("Verify payment error:", err);
      const status = err.message?.includes("signature") ? 400 : 500;
      res.status(status).json({ message: err.message || "Failed to verify payment" });
    }
  };

  app.post("/api/payments/verify", handleVerifyPayment);
  app.post("/api/razorpay/verify-payment", handleVerifyPayment);

  app.post("/api/payments/activate-free", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to activate the free plan" });
      }

      await activateFreePlan(req.user.id);
      const updatedUser = await storage.getUser(req.user.id);
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      console.error("Activate free plan error:", err);
      res.status(500).json({ message: err.message || "Failed to activate free plan" });
    }
  });

  app.get("/api/razorpay/subscription", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.user.id);
      res.json({
        plan: user?.plan || "free",
        planExpiresAt: user?.planExpiresAt || null,
        razorpayCustomerId: user?.razorpayCustomerId || null,
      });
    } catch {
      res.json({ plan: "free", planExpiresAt: null });
    }
  });

  app.post("/api/razorpay/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string | undefined;
      const rawBody = (req as any).rawBody as string | undefined;

      if (!signature || !rawBody) {
        return res.status(400).json({ message: "Missing signature or body" });
      }

      if (!verifyWebhookSignature(rawBody, signature)) {
        console.error("[Webhook] Invalid Razorpay webhook signature");
        return res.status(400).json({ message: "Invalid signature" });
      }

      const event = req.body;
      const eventName: string = event?.event;

      if (eventName === "payment.captured" || eventName === "order.paid") {
        const orderId: string =
          event?.payload?.payment?.entity?.order_id ||
          event?.payload?.order?.entity?.id;

        if (!orderId) {
          return res.status(200).json({ status: "ignored - no order id" });
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.fetch(orderId);
        const planKey = (order.notes as Record<string, string>)?.planKey;
        const userId = parseInt((order.notes as Record<string, string>)?.userId || "0", 10);

        if (!planKey || !userId) {
          return res.status(200).json({ status: "ignored - missing notes" });
        }

        const plan = resolveRazorpayPlan(planKey);
        if (!plan) {
          return res.status(200).json({ status: "ignored - unknown plan" });
        }

        const currentUser = await storage.getUser(userId);
        if (
          currentUser &&
          currentUser.plan !== "free" &&
          currentUser.planExpiresAt &&
          new Date(currentUser.planExpiresAt) > new Date()
        ) {
          return res.status(200).json({ status: "already_upgraded" });
        }

        const paymentId: string = event?.payload?.payment?.entity?.id || orderId;
        const legacy = legacyPlanKeyToNewPlan(planKey);
        const isAnnual = plan.period === "yearly";
        const periodEnd = new Date();
        if (isAnnual) {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await storage.updateRazorpayCustomerId(userId, paymentId);
        await storage.updateUserPlan(userId, legacy.plan, periodEnd);
        await storage.updateUserSubscriptionFields(userId, {
          planType: legacy.planType,
          planName: legacy.planName,
          billingCycle: legacy.billingCycle,
        });
        await storage.updatePaymentByOrderId(orderId, {
          razorpayPaymentId: paymentId,
          status: "captured",
        });

        console.log(`[Webhook] Upgraded user ${userId} to ${legacy.planName} (${orderId})`);
      }

      return res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("[Webhook] Error:", err);
      return res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/razorpay/recover-payment", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to recover your payment" });
      }

      const { orderId } = req.body;
      if (!orderId || typeof orderId !== "string") {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const { user, plan } = await activateFromPaidOrder(orderId.trim(), req.user.id);
      const legacy = legacyPlanKeyToNewPlan(plan.planKey);
      return res.json({ success: true, plan: legacy.planName, user });
    } catch (err: any) {
      console.error("[Recover] Payment recovery error:", err);
      const status = err.message?.includes("not paid") ? 400 : 500;
      return res.status(status).json({
        message: err.message || "Payment recovery failed. Please contact support.",
      });
    }
  });

  // Expose for tests / internal use
  void allPlans;
}
