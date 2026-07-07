import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PricingCard, type BillingCycle } from "@/components/PricingCard";
import { TopUpSection } from "@/components/TopUpSection";
import { useUser } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import {
  FREE_PLAN_WORKSHEETS_INCLUDED,
  getPlan,
  getPlanFeatures,
  getTopUpPlanList,
  getWorksheetLabel,
  getYearlyWorksheetTotal,
  PRICING_SECTIONS,
  type PaidWorksheetPlanKey,
  type TopUpPlanKey,
  type WorksheetPlanKey,
} from "@shared/pricing";
import { cn } from "@/lib/utils";

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
  planKey: string;
  billingCycle?: BillingCycle;
  userEmail?: string;
  userName?: string;
  userMobile?: string;
  onSuccess?: (planName: string) => void;
}) {
  await ensureRazorpayLoaded();

  const orderRes = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      planKey: opts.planKey,
      ...(opts.billingCycle ? { billingCycle: opts.billingCycle } : {}),
    }),
  });
  const orderJson = await orderRes.json();
  if (!orderRes.ok) {
    if (orderJson?.message?.includes("Razorpay") || orderRes.status === 500) {
      throw new Error(
        orderJson?.message ||
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env and restart the server.",
      );
    }
    throw new Error(orderJson?.message || "Failed to create order");
  }

  const keyId = orderJson.keyId as string | undefined;
  if (!keyId) {
    const keyRes = await fetch("/api/razorpay/key");
    const keyJson = await keyRes.json();
    if (!keyRes.ok) throw new Error(keyJson?.message || "Razorpay not configured");
    orderJson.keyId = keyJson.keyId;
  }

  const contact =
    opts.userMobile && opts.userMobile.length === 10
      ? `+91${opts.userMobile}`
      : undefined;

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
        contact,
      },
      notes: {
        planKey: orderJson.planKey,
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
        confirm_close: true,
        escape: false,
      },
      theme: { color: "#9333ea" },
    });
    rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
      reject(new Error(response?.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}

function planCardId(planKey: WorksheetPlanKey, cycle?: BillingCycle): string {
  if (planKey === "free_2") return "free";
  return cycle ? `${planKey}-${cycle}` : planKey;
}

function userCanTopUp(
  user: { plan?: string; planExpiresAt?: string | null } | null | undefined,
): boolean {
  if (!user || user.plan !== "paid") return false;
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return false;
  return true;
}

type PricingPlansSectionProps = {
  headerVariant?: "landing" | "page" | "none";
  showPaymentRecover?: boolean;
  className?: string;
};

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 sm:mb-10 text-center">
      <h2 className="text-xl sm:text-2xl font-display font-bold">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xl mx-auto">{subtitle}</p>
      )}
    </div>
  );
}

export function PricingPlansSection({
  headerVariant = "page",
  showPaymentRecover = false,
  className,
}: PricingPlansSectionProps) {
  const { toast } = useToast();
  const { data: user } = useUser();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

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
    planId: string,
    planKey: PaidWorksheetPlanKey,
    billingCycle: BillingCycle,
    displayName: string,
  ) => {
    if (!user && !requireAuth()) return;
    setSelectedPlanId(planId);
    setCheckoutPlanId(planId);
    try {
      await startRazorpayCheckout({
        planKey,
        billingCycle,
        userEmail: user?.email,
        userName: user?.name,
        userMobile: user?.mobileNumber,
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
      setCheckoutPlanId(null);
    }
  };

  const isProcessing = (planId: string) => checkoutPlanId === planId;

  const handleTopUp = async (planKey: TopUpPlanKey, worksheets: number) => {
    if (!user && !requireAuth()) return;
    if (!userCanTopUp(user)) {
      toast({
        title: "Top-up unavailable",
        description: "Subscribe to any paid plan first, then you can buy top-ups.",
        variant: "destructive",
      });
      return;
    }
    setCheckoutPlanId(planKey);
    try {
      await startRazorpayCheckout({
        planKey,
        userEmail: user?.email,
        userName: user?.name,
        userMobile: user?.mobileNumber,
        onSuccess: () => {
          window.location.href = `/payment/success?plan=${encodeURIComponent(`Top-up +${worksheets} worksheets`)}&topup=1`;
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Top-up payment could not be completed";
      if (msg !== "Payment cancelled") {
        toast({ title: "Top-up failed", description: msg, variant: "destructive" });
      }
    } finally {
      setCheckoutPlanId(null);
    }
  };

  const renderPlanCard = (planKey: WorksheetPlanKey) => {
    const plan = getPlan(planKey);

    if (plan.category === "free") {
      return (
        <PricingCard
          key={planKey}
          planId="free"
          selected={selectedPlanId === "free"}
          disabled={!!checkoutPlanId}
          planName={plan.name}
          planNameMonthly={getWorksheetLabel(planKey, "free")}
          description={plan.description}
          price={{ kind: "free", amount: 0 }}
          features={getPlanFeatures(planKey, "free")}
          ctaLabel="Start free"
          badgeLabel={plan.badgeLabel}
          onSelect={async () => {
            if (!user && !requireAuth()) return;
            setSelectedPlanId("free");
            try {
              await activateFreePlan();
              await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
              toast({
                title: "Free plan active",
                description: `You can generate up to ${FREE_PLAN_WORKSHEETS_INCLUDED} worksheets.`,
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
        />
      );
    }

    const paidKey = planKey as PaidWorksheetPlanKey;

    return (
      <PricingCard
        key={planKey}
        planId={paidKey}
        selected={
          selectedPlanId === planCardId(paidKey, "monthly") ||
          selectedPlanId === planCardId(paidKey, "yearly")
        }
        disabled={!!checkoutPlanId}
        planName={plan.name}
        planNameMonthly={getWorksheetLabel(paidKey, "monthly")}
        planNameYearly={getWorksheetLabel(paidKey, "yearly")}
        description={plan.description}
        popular={plan.popular}
        highlighted={plan.highlighted}
        badgeLabel={plan.badgeLabel}
        price={{
          kind: "fixed",
          monthly: plan.monthlyPrice,
          yearly: plan.yearlyDiscountedPrice ?? 0,
          yearlyOriginal: plan.yearlyPrice ?? undefined,
        }}
        featuresMonthly={getPlanFeatures(paidKey, "monthly")}
        featuresYearly={getPlanFeatures(paidKey, "yearly")}
        ctaLabel={
          isProcessing(planCardId(paidKey, "monthly")) ||
          isProcessing(planCardId(paidKey, "yearly"))
            ? "Opening payment…"
            : "Choose plan"
        }
        onSelect={async (cycle) =>
          handlePaidPlan(
            planCardId(paidKey, cycle),
            paidKey,
            cycle,
            cycle === "yearly"
              ? `${getYearlyWorksheetTotal(plan.worksheetsIncluded)} Worksheets`
              : plan.name,
          )
        }
        showCycleToggle
      />
    );
  };

  const sectionGridClass = (sectionId: string) =>
    sectionId === "parents"
      ? "mx-auto grid w-full max-w-5xl grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3"
      : "mx-auto grid w-full max-w-3xl grid-cols-1 justify-items-center gap-6 sm:grid-cols-2";

  return (
    <div className={cn(className)}>
      {headerVariant === "landing" && (
        <div className="mb-8 sm:mb-12 text-center px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-2 sm:mb-3">
            Choose a <span className="text-gradient-primary">plan</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>
      )}

      {headerVariant === "page" && (
        <div className="max-w-3xl">
          <p className="text-sm text-muted-foreground">Start free. Upgrade when you&apos;re ready.</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-display font-bold">Choose a plan</h1>
          <p className="text-muted-foreground mt-2">
            Plans for parents and professionals — with monthly, yearly, and top-up options.
          </p>
        </div>
      )}

      {PRICING_SECTIONS.map((section, index) => (
        <section
          key={section.id}
          className={cn(index === 0 ? (headerVariant !== "none" ? "mt-10" : undefined) : "mt-16 sm:mt-20")}
        >
          <SectionHeading title={section.title} subtitle={section.subtitle} />
          <div className={sectionGridClass(section.id)}>
            {section.planKeys.map((planKey) => renderPlanCard(planKey))}
          </div>
        </section>
      ))}

      <TopUpSection
        plans={getTopUpPlanList()}
        disabled={!!checkoutPlanId}
        topUpEnabled={userCanTopUp(user)}
        processingKey={checkoutPlanId}
        onSelect={(planKey, worksheets) => handleTopUp(planKey as TopUpPlanKey, worksheets)}
      />

      {showPaymentRecover && user && (
        <div className="text-center mt-12">
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
