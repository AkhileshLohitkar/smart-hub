import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type BillingCycle = "monthly" | "yearly";

type PriceShape =
  | { kind: "free"; amount: 0 }
  | {
      kind: "fixed";
      monthly: number;
      yearly: number;
      yearlyOriginal?: number;
    };

export type PricingCardProps = {
  planId: string;
  planName: string;
  planNameMonthly?: string;
  planNameYearly?: string;
  featuresMonthly?: string[];
  featuresYearly?: string[];
  description?: string;
  popular?: boolean;
  highlighted?: boolean;
  badgeLabel?: string;
  selected?: boolean;
  price: PriceShape;
  features?: string[];
  ctaLabel?: string;
  onSelect?: (cycle: BillingCycle) => void;
  showCycleToggle?: boolean;
  cycleOverride?: BillingCycle;
  disabled?: boolean;
  yearlySavePercent?: number;
};

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function PricingCard({
  planId,
  planName,
  planNameMonthly,
  planNameYearly,
  featuresMonthly,
  featuresYearly,
  description,
  popular,
  highlighted,
  badgeLabel,
  selected,
  price,
  features = [],
  ctaLabel = "Choose plan",
  onSelect,
  showCycleToggle = true,
  cycleOverride,
  disabled,
  yearlySavePercent = 25,
}: PricingCardProps) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const effectiveCycle = cycleOverride ?? cycle;

  const { amount, periodLabel } = useMemo(() => {
    if (price.kind === "free") {
      return { amount: 0, periodLabel: "" };
    }
    const a = effectiveCycle === "yearly" ? price.yearly : price.monthly;
    return {
      amount: a,
      periodLabel: effectiveCycle === "yearly" ? "/year" : "/month",
    };
  }, [effectiveCycle, price]);

  const showYearlySavings =
    price.kind === "fixed" &&
    effectiveCycle === "yearly" &&
    typeof price.yearlyOriginal === "number" &&
    price.yearlyOriginal > price.yearly;

  const worksheetLabel = useMemo(() => {
    if (showCycleToggle && !cycleOverride) {
      if (effectiveCycle === "yearly" && planNameYearly) return planNameYearly;
      if (effectiveCycle === "monthly" && planNameMonthly) return planNameMonthly;
    }
    return null;
  }, [showCycleToggle, cycleOverride, effectiveCycle, planNameMonthly, planNameYearly]);

  const displayFeatures = useMemo(() => {
    if (showCycleToggle && !cycleOverride) {
      if (effectiveCycle === "yearly" && featuresYearly) return featuresYearly;
      if (effectiveCycle === "monthly" && featuresMonthly) return featuresMonthly;
    }
    return features;
  }, [showCycleToggle, cycleOverride, effectiveCycle, features, featuresMonthly, featuresYearly]);

  const isPrimaryCta = !!popular || !!highlighted || !!selected;
  const isGlowing = selected || popular || highlighted;

  const handleActivate = () => {
    if (disabled) return;
    onSelect?.(effectiveCycle);
  };

  return (
    <Card
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-testid={`pricing-card-${planId}`}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
      className={cn(
        "relative mx-auto flex w-full max-w-[min(100%,22rem)] flex-col overflow-visible rounded-2xl border",
        "bg-card/60 px-6 pb-7 pt-10 backdrop-blur-md",
        "dark:bg-[#0f0f18]/80 dark:border-white/10",
        "dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
        "transition-all duration-300 hover:-translate-y-1.5",
        !disabled && "cursor-pointer",
        disabled && "opacity-70 pointer-events-none",
        isGlowing
          ? "dark:border-pink-500/50 dark:shadow-[0_0_0_1px_rgba(236,72,153,0.4),0_20px_56px_rgba(236,72,153,0.15)]"
          : "dark:hover:border-pink-500/25 dark:hover:shadow-[0_16px_48px_rgba(147,51,234,0.08)]",
        selected && "ring-2 ring-pink-500/60 ring-offset-2 ring-offset-background",
        "min-h-[420px]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl transition-opacity",
          isGlowing
            ? "bg-gradient-to-br from-pink-500/25 to-purple-500/20 opacity-100"
            : "bg-gradient-to-br from-pink-500/10 to-purple-500/8 opacity-80",
        )}
      />

      {(badgeLabel || popular) && (
        <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
          <span
            className={cn(
              "inline-flex items-center whitespace-nowrap rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider",
              "border border-white/15 bg-gradient-to-r from-purple-600 to-pink-600 text-white",
              "shadow-[0_4px_20px_rgba(236,72,153,0.4)]",
            )}
          >
            {badgeLabel ?? "Most Popular"}
          </span>
        </div>
      )}

      <div className="relative flex flex-1 flex-col items-center text-center">
        <div className="w-full min-w-0 space-y-1">
          <h3 className="text-xl font-bold leading-tight text-foreground dark:text-white">
            {planName}
          </h3>
          {worksheetLabel && (
            <p className="text-sm font-semibold text-gradient-primary">{worksheetLabel}</p>
          )}
          {description && (
            <p className="text-xs leading-snug text-muted-foreground dark:text-gray-400 pt-0.5">
              {description}
            </p>
          )}
        </div>

        <div className="mt-6 w-full">
          {price.kind === "free" ? (
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-4xl font-bold tracking-tight text-foreground dark:text-white">
                {formatInr(0)}
              </span>
            </div>
          ) : showYearlySavings ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground dark:text-white">
                  {formatInr(amount)}
                </span>
                <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                  {periodLabel}
                </span>
              </div>
              <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/70">
                {formatInr(price.yearlyOriginal as number)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                  "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
                )}
              >
                Save {yearlySavePercent}%
              </span>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold tracking-tight text-foreground dark:text-white">
                {formatInr(amount)}
              </span>
              <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                {periodLabel}
              </span>
            </div>
          )}
        </div>

        {showCycleToggle && price.kind !== "free" && (
          <div
            className={cn(
              "mt-5 inline-flex rounded-full p-1",
              "border border-[#E5E7EB] bg-[#F8F9FC] shadow-sm",
              "dark:border-pink-500/35 dark:bg-[#0c0c14]/95",
              "dark:shadow-[0_0_0_1px_rgba(236,72,153,0.35),0_4px_20px_rgba(236,72,153,0.12)]",
            )}
            onClick={(e) => e.stopPropagation()}
            role="group"
            aria-label="Billing cycle"
          >
            <button
              type="button"
              className={cn(
                "min-w-[5rem] rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300",
                cycle === "monthly"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_14px_rgba(236,72,153,0.45),0_0_0_1px_rgba(236,72,153,0.4)]"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:border-white/5 dark:bg-transparent dark:text-gray-400 dark:hover:bg-transparent dark:hover:text-gray-200",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setCycle("monthly");
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cn(
                "min-w-[5rem] rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300",
                cycle === "yearly"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_14px_rgba(236,72,153,0.45),0_0_0_1px_rgba(236,72,153,0.4)]"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:border-white/5 dark:bg-transparent dark:text-gray-400 dark:hover:bg-transparent dark:hover:text-gray-200",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setCycle("yearly");
              }}
            >
              Yearly
            </button>
          </div>
        )}

        {displayFeatures.length > 0 && (
          <ul className="mt-6 w-full flex-1 space-y-3 text-left">
            {displayFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] font-medium text-gray-800 dark:text-gray-100">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="h-3 w-3" />
                </span>
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7 flex w-full justify-center">
          <Button
            className={cn(
              "h-11 w-full rounded-xl text-sm font-semibold",
              "transition-all duration-300 hover:opacity-95",
              isPrimaryCta
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.35)] hover:shadow-[0_0_28px_rgba(236,72,153,0.5)]"
                : "border-white/20 bg-transparent text-foreground hover:bg-white/5 dark:text-white",
            )}
            variant={isPrimaryCta ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              handleActivate();
            }}
            disabled={disabled}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
