import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PricingCard, type BillingCycle } from "@/components/PricingCard";
import { useUser } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { FREE_PLAN_WORKSHEETS_INCLUDED } from "@shared/worksheetLimits";
import { cn } from "@/lib/utils";

type WorksheetPlanKey = "free_2" | "w50" | "w100" | "w200" | "w400";

type PricingPlans = {
  free_2: { name: string; worksheetsIncluded: number };
  w50: {
    name: string;
    worksheetsIncluded: number;
    monthlyPrice: number;
    yearlyPrice: number;
    yearlyDiscountedPrice: number;
    topUpWorksheetsPerMonth: number;
    topUpPrice: number;
    popular?: boolean;
  };
  w100: {
    name: string;
    worksheetsIncluded: number;
    monthlyPrice: number;
    yearlyPrice: number;
    yearlyDiscountedPrice: number;
    topUpWorksheetsPerMonth: number;
    topUpPrice: number;
  };
  w200: {
    name: string;
    worksheetsIncluded: number;
    monthlyPrice: number;
    yearlyPrice: number;
    yearlyDiscountedPrice: number;
    topUpWorksheetsPerMonth: number;
    topUpPrice: number;
  };
  w400: {
    name: string;
    worksheetsIncluded: number;
    monthlyPrice: number;
    yearlyPrice: number;
    yearlyDiscountedPrice: number;
    topUpWorksheetsPerMonth: number;
    topUpPrice: number;
  };
  order: readonly WorksheetPlanKey[];
};

async function fetchPricing(): Promise<PricingPlans> {
  const res = await fetch("/api/pricing");
  if (!res.ok) throw new Error("Failed to load pricing");
  return res.json();
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

async function ensureRazorpayLoaded(): Promise<void> {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}

async function parseError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return json?.message || "Request failed";
  } catch {
    return "Request failed";
  }
}

async function activateFreePlan(): Promise<void> {
  const res = await fetch("/api/payments/activate-free", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

async function startRazorpayCheckout(opts: {
  planKey: WorksheetPlanKey;
  billingCycle: BillingCycle;
  userEmail?: string;
  userName?: string;
  onSuccess?: (planName: string) => void;
}) {
  await ensureRazorpayLoaded();

  const orderRes = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ planKey: opts.planKey, billingCycle: opts.billingCycle }),
  });
  const orderJson = await orderRes.json();
  if (!orderRes.ok) throw new Error(orderJson?.message || "Failed to create order");

  const keyId = orderJson.keyId as string | undefined;
  if (!keyId) {
    const keyRes = await fetch("/api/razorpay/key");
    const keyJson = await keyRes.json();
    if (!keyRes.ok) throw new Error(keyJson?.message || "Razorpay not configured");
    orderJson.keyId = keyJson.keyId;
  }

  return new Promise<void>((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: orderJson.keyId,
      amount: orderJson.amount,
      currency: orderJson.currency,
      name: "Qik Worksheets",
      description: orderJson.planName,
      order_id: orderJson.orderId,
      prefill: {
        email: opts.userEmail,
        name: opts.userName,
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(response),
          });
          const verifyJson = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyJson?.message || "Payment verification failed");
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          opts.onSuccess?.(orderJson.planName);
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
      theme: { color: "#ec4899" },
    });
    rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
      reject(new Error(response?.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}

type PricingPlansSectionProps = {
  /** landing: centered marketing header; page: left-aligned page header */
  headerVariant?: "landing" | "page" | "none";
  showPaymentRecover?: boolean;
  className?: string;
};

export function PricingPlansSection({
  headerVariant = "page",
  showPaymentRecover = false,
  className,
}: PricingPlansSectionProps) {
  const { toast } = useToast();
  const { data: user } = useUser();
  const [pricing, setPricing] = useState<PricingPlans | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutPlanKey, setCheckoutPlanKey] = useState<WorksheetPlanKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPricing()
      .then((p) => {
        if (!cancelled) setPricing(p);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not load pricing. Please refresh.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const requireAuth = () => {
    toast({
      title: "Sign in required",
      description: "Please log in to choose a plan.",
      variant: "destructive",
    });
    window.location.href = "/auth";
    return false;
  };

  const handlePaidPlan = async (
    planKey: WorksheetPlanKey,
    billingCycle: BillingCycle,
    displayName: string,
  ) => {
    if (!user && !requireAuth()) return;
    setCheckoutPlanKey(planKey);
    try {
      await startRazorpayCheckout({
        planKey,
        billingCycle,
        userEmail: user?.email,
        userName: user?.name,
        onSuccess: (planName) => {
          window.location.href = `/payment/success?plan=${encodeURIComponent(planName || displayName)}`;
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Payment could not be completed";
      if (msg !== "Payment cancelled") {
        toast({ title: "Payment error", description: msg, variant: "destructive" });
      }
    } finally {
      setCheckoutPlanKey(null);
    }
  };

  return (
    <div className={cn(className)}>
      {headerVariant === "landing" && (
        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">
            Choose a <span className="text-gradient-primary">plan</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>
      )}

      {headerVariant === "page" && (
        <div className="max-w-3xl">
          <p className="text-sm text-muted-foreground">Start free. Upgrade when you&apos;re ready.</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-display font-bold">Choose a plan</h1>
          <p className="text-muted-foreground mt-2">
            Worksheet-based plans with monthly, yearly (discounted), and top-up options.
          </p>
        </div>
      )}

      {loading && !pricing ? (
        <p className={cn("text-muted-foreground", headerVariant !== "none" && "mt-8")}>
          Loading pricing…
        </p>
      ) : (
        <section className={cn(headerVariant !== "none" && "mt-10")}>
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            <PricingCard
              planName={`${pricing?.free_2?.worksheetsIncluded ?? FREE_PLAN_WORKSHEETS_INCLUDED} Worksheets`}
              description="Perfect to try Qik Worksheets"
              price={{ kind: "free", amount: 0 }}
              features={[
                `Up to ${pricing?.free_2?.worksheetsIncluded ?? FREE_PLAN_WORKSHEETS_INCLUDED} worksheets`,
                "Watermark on worksheets",
              ]}
              ctaLabel="Start free"
              onSelect={async () => {
                if (!user && !requireAuth()) return;
                try {
                  await activateFreePlan();
                  await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                  toast({
                    title: "Free plan active",
                    description: `You can generate up to ${pricing?.free_2?.worksheetsIncluded ?? FREE_PLAN_WORKSHEETS_INCLUDED} worksheets.`,
                  });
                  window.location.href = "/home";
                } catch (e: unknown) {
                  toast({
                    title: "Error",
                    description: e instanceof Error ? e.message : "Failed",
                    variant: "destructive",
                  });
                }
              }}
              showCycleToggle={false}
              badgeLabel="Free"
            />

            <PricingCard
              planName={`${pricing?.w50.worksheetsIncluded ?? 50} Worksheets — Monthly`}
              description="Best for regular practice"
              popular={pricing?.w50.popular ?? true}
              badgeLabel="Most Popular"
              price={{
                kind: "fixed",
                monthly: pricing?.w50.monthlyPrice ?? 199,
                yearly: pricing?.w50.yearlyDiscountedPrice ?? 2149,
                yearlyOriginal: pricing?.w50.yearlyPrice ?? 2399,
              }}
              features={[
                `Up to ${pricing?.w50.worksheetsIncluded ?? 50} worksheets / month`,
                "Limited worksheets",
                "Print & download",
                "Priority support",
              ]}
              ctaLabel={checkoutPlanKey === "w50" ? "Processing…" : "Continue"}
              onSelect={async () =>
                handlePaidPlan("w50", "monthly", pricing?.w50.name || "50 Worksheets")
              }
              showCycleToggle={false}
              cycleOverride="monthly"
              topUp={
                pricing?.w50
                  ? { worksheets: pricing.w50.topUpWorksheetsPerMonth, price: pricing.w50.topUpPrice }
                  : null
              }
            />

            <PricingCard
              planName={`${pricing?.w50.worksheetsIncluded ?? 50} Worksheets — Yearly`}
              description="Best value (discounted yearly)"
              badgeLabel="Best Value"
              price={{
                kind: "fixed",
                monthly: pricing?.w50.monthlyPrice ?? 199,
                yearly: pricing?.w50.yearlyDiscountedPrice ?? 2149,
                yearlyOriginal: pricing?.w50.yearlyPrice ?? 2399,
              }}
              features={[
                `Up to ${pricing?.w50.worksheetsIncluded ?? 50} worksheets / month`,
                "Limited worksheets",
                "Print & download",
                "Priority support",
              ]}
              ctaLabel={checkoutPlanKey === "w50" ? "Processing…" : "Continue"}
              onSelect={async () =>
                handlePaidPlan("w50", "yearly", pricing?.w50.name || "50 Worksheets")
              }
              showCycleToggle={false}
              cycleOverride="yearly"
              topUp={
                pricing?.w50
                  ? { worksheets: pricing.w50.topUpWorksheetsPerMonth, price: pricing.w50.topUpPrice }
                  : null
              }
            />

            <PricingCard
              planName={`${pricing?.w100.worksheetsIncluded ?? 100} Worksheets — Monthly`}
              description="More worksheets for higher usage"
              price={{
                kind: "fixed",
                monthly: pricing?.w100.monthlyPrice ?? 399,
                yearly: pricing?.w100.yearlyDiscountedPrice ?? 4299,
                yearlyOriginal: pricing?.w100.yearlyPrice ?? 4799,
              }}
              features={[
                `Up to ${pricing?.w100.worksheetsIncluded ?? 100} worksheets / month`,
                "Limited worksheets",
                "Print & download",
                "Priority support",
              ]}
              ctaLabel={checkoutPlanKey === "w100" ? "Processing…" : "Continue"}
              onSelect={async () =>
                handlePaidPlan("w100", "monthly", pricing?.w100.name || "100 Worksheets")
              }
              showCycleToggle={false}
              cycleOverride="monthly"
              topUp={
                pricing?.w100
                  ? {
                      worksheets: pricing.w100.topUpWorksheetsPerMonth,
                      price: pricing.w100.topUpPrice,
                    }
                  : null
              }
            />

            <PricingCard
              planName={`${pricing?.w100.worksheetsIncluded ?? 100} Worksheets — Yearly`}
              description="Discounted yearly billing"
              price={{
                kind: "fixed",
                monthly: pricing?.w100.monthlyPrice ?? 399,
                yearly: pricing?.w100.yearlyDiscountedPrice ?? 4299,
                yearlyOriginal: pricing?.w100.yearlyPrice ?? 4799,
              }}
              features={[
                `Up to ${pricing?.w100.worksheetsIncluded ?? 100} worksheets / month`,
                "Limited worksheets",
                "Print & download",
                "Priority support",
              ]}
              ctaLabel={checkoutPlanKey === "w100" ? "Processing…" : "Continue"}
              onSelect={async () =>
                handlePaidPlan("w100", "yearly", pricing?.w100.name || "100 Worksheets")
              }
              showCycleToggle={false}
              cycleOverride="yearly"
              topUp={
                pricing?.w100
                  ? {
                      worksheets: pricing.w100.topUpWorksheetsPerMonth,
                      price: pricing.w100.topUpPrice,
                    }
                  : null
              }
            />

            <PricingCard
              planName={`${pricing?.w200.worksheetsIncluded ?? 200} Worksheets — Monthly`}
              description="For high monthly usage"
              price={{
                kind: "fixed",
                monthly: pricing?.w200.monthlyPrice ?? 799,
                yearly: pricing?.w200.yearlyDiscountedPrice ?? 8599,
                yearlyOriginal: pricing?.w200.yearlyPrice ?? 9599,
              }}
              features={[
                `Up to ${pricing?.w200.worksheetsIncluded ?? 200} worksheets / month`,
                "Limited worksheets",
                "Print & download",
                "Priority support",
              ]}
              ctaLabel={checkoutPlanKey === "w200" ? "Processing…" : "Continue"}
              onSelect={async () =>
                handlePaidPlan("w200", "monthly", pricing?.w200.name || "200 Worksheets")
              }
              showCycleToggle={false}
              cycleOverride="monthly"
              topUp={
                pricing?.w200
                  ? {
                      worksheets: pricing.w200.topUpWorksheetsPerMonth,
                      price: pricing.w200.topUpPrice,
                    }
                  : null
              }
            />

            <PricingCard
              planName={`${pricing?.w200.worksheetsIncluded ?? 200} Worksheets — Yearly`}
              description="Discounted yearly billing"
              price={{
                kind: "fixed",
                monthly: pricing?.w200.monthlyPrice ?? 799,
                yearly: pricing?.w200.yearlyDiscountedPrice ?? 8599,
                yearlyOriginal: pricing?.w200.yearlyPrice ?? 9599,
              }}
              features={[
                `Up to ${pricing?.w200.worksheetsIncluded ?? 200} worksheets / month`,
                "Limited worksheets",
                "Print & download",
                "Priority support",
              ]}
              ctaLabel={checkoutPlanKey === "w200" ? "Processing…" : "Continue"}
              onSelect={async () =>
                handlePaidPlan("w200", "yearly", pricing?.w200.name || "200 Worksheets")
              }
              showCycleToggle={false}
              cycleOverride="yearly"
              topUp={
                pricing?.w200
                  ? {
                      worksheets: pricing.w200.topUpWorksheetsPerMonth,
                      price: pricing.w200.topUpPrice,
                    }
                  : null
              }
            />

            <PricingCard
              planName={`${pricing?.w400.worksheetsIncluded ?? 400} Worksheets — Monthly`}
              description="For maximum monthly usage"
              price={{
                kind: "fixed",
                monthly: pricing?.w400.monthlyPrice ?? 1599,
                yearly: pricing?.w400.yearlyDiscountedPrice ?? 17199,
                yearlyOriginal: pricing?.w400.yearlyPrice ?? 19199,
              }}
              features={[
                `Up to ${pricing?.w400.worksheetsIncluded ?? 400} worksheets / month`,
                "Limited worksheets",
                "Print & download",
                "Priority support",
              ]}
              ctaLabel={checkoutPlanKey === "w400" ? "Processing…" : "Continue"}
              onSelect={async () =>
                handlePaidPlan("w400", "monthly", pricing?.w400.name || "400 Worksheets")
              }
              showCycleToggle={false}
              cycleOverride="monthly"
              topUp={
                pricing?.w400
                  ? {
                      worksheets: pricing.w400.topUpWorksheetsPerMonth,
                      price: pricing.w400.topUpPrice,
                    }
                  : null
              }
            />

            <PricingCard
              planName={`${pricing?.w400.worksheetsIncluded ?? 400} Worksheets — Yearly`}
              description="Discounted yearly billing"
              badgeLabel="Popular"
              price={{
                kind: "fixed",
                monthly: pricing?.w400.monthlyPrice ?? 1599,
                yearly: pricing?.w400.yearlyDiscountedPrice ?? 17199,
                yearlyOriginal: pricing?.w400.yearlyPrice ?? 19199,
              }}
              features={[
                `Up to ${pricing?.w400.worksheetsIncluded ?? 400} worksheets / month`,
                "Limited worksheets",
                "Print & download",
                "Priority support",
              ]}
              ctaLabel={checkoutPlanKey === "w400" ? "Processing…" : "Continue"}
              onSelect={async () =>
                handlePaidPlan("w400", "yearly", pricing?.w400.name || "400 Worksheets")
              }
              showCycleToggle={false}
              cycleOverride="yearly"
              topUp={
                pricing?.w400
                  ? {
                      worksheets: pricing.w400.topUpWorksheetsPerMonth,
                      price: pricing.w400.topUpPrice,
                    }
                  : null
              }
            />
          </div>
        </section>
      )}

      {showPaymentRecover && user && (
        <div className="text-center mt-8">
          <Link href="/payment/recover">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              data-testid="link-recover-payment"
            >
              Paid before and your plan wasn&apos;t upgraded? Recover your payment →
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
