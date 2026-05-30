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
  planName: string;
  description?: string;
  popular?: boolean;
  badgeLabel?: string;
  price: PriceShape;
  features?: string[];
  topUp?: { worksheets: number; price: number } | null;
  ctaLabel?: string;
  onSelect?: (cycle: BillingCycle) => void;
  showCycleToggle?: boolean;
  /** When set, the card shows this cycle (no internal toggle). */
  cycleOverride?: BillingCycle;
};

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function PricingCard({
  planName,
  description,
  popular,
  badgeLabel,
  price,
  features = [],
  topUp = null,
  ctaLabel = "Choose plan",
  onSelect,
  showCycleToggle = true,
  cycleOverride,
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
  const yearlySavingsAmount =
    price.kind === "fixed" && showYearlySavings
      ? (price.yearlyOriginal as number) - price.yearly
      : 0;

  const displayFeatures = useMemo(() => {
    const list = [...features];
    if (showYearlySavings && yearlySavingsAmount > 0) {
      list.push(`Save ${formatInr(yearlySavingsAmount)}/year`);
    }
    return list;
  }, [features, showYearlySavings, yearlySavingsAmount]);

  const isPrimaryCta = !!popular;

  return (
    <Card
      className={cn(
        "relative mx-auto flex w-full max-w-[260px] min-h-[400px] flex-col overflow-visible rounded-2xl border",
        "bg-card/60 px-5 pb-6 pt-9 backdrop-blur-md",
        "dark:bg-[#0f0f18]/80 dark:border-white/10",
        "dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
        "transition-all duration-200 hover:-translate-y-1",
        popular
          ? "dark:border-pink-500/50 dark:shadow-[0_0_0_1px_rgba(236,72,153,0.35),0_16px_48px_rgba(236,72,153,0.12)]"
          : "dark:hover:border-pink-500/20",
      )}
    >
      <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br from-pink-500/15 to-purple-500/10 blur-2xl" />

      {(badgeLabel || popular) && (
        <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
          <span
            className={cn(
              "inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
              "border border-white/10 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md",
            )}
          >
            {badgeLabel ?? "Most Popular"}
          </span>
        </div>
      )}

      <div className="relative flex flex-1 flex-col items-center text-center">
        <div className="w-full min-w-0">
          <h3 className="text-base font-bold leading-tight text-foreground dark:text-white">
            {planName}
          </h3>
          {description && (
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div className="mt-5 w-full">
          {price.kind === "free" ? (
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-3xl font-bold tracking-tight text-foreground dark:text-white">
                {formatInr(0)}
              </span>
            </div>
          ) : showYearlySavings ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold tracking-tight text-foreground dark:text-white">
                  {formatInr(amount)}
                </span>
                <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                  {periodLabel}
                </span>
              </div>
              <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/70">
                {formatInr(price.yearlyOriginal as number)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground dark:text-white">
                {formatInr(amount)}
              </span>
              <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                {periodLabel}
              </span>
            </div>
          )}
          {/* per-day caption removed */}
        </div>

        {showCycleToggle && price.kind !== "free" && (
          <div className="mt-4 flex rounded-lg border border-border/60 overflow-hidden">
            <button
              className={cn("px-3 py-1.5 text-xs", cycle === "monthly" && "bg-muted font-semibold")}
              onClick={() => setCycle("monthly")}
              type="button"
            >
              Monthly
            </button>
            <button
              className={cn("px-3 py-1.5 text-xs", cycle === "yearly" && "bg-muted font-semibold")}
              onClick={() => setCycle("yearly")}
              type="button"
            >
              Yearly
            </button>
          </div>
        )}

        {displayFeatures.length > 0 && (
          <ul className="mt-6 w-full flex-1 space-y-2.5 text-left">
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

        {topUp && price.kind !== "free" ? (
          <div className="mt-4 w-full rounded-lg border border-border/50 p-2.5 text-left dark:border-white/10 dark:bg-white/5">
            <div className="text-[10px] text-muted-foreground">Top-up / month</div>
            <div className="text-xs font-semibold text-foreground dark:text-white">
              {topUp.worksheets} worksheets → {formatInr(topUp.price)}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex w-full justify-center">
          <Button
            className={cn(
              "h-10 w-[180px] rounded-xl text-sm font-semibold",
              "transition-all hover:opacity-95",
              isPrimaryCta
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_16px_rgba(236,72,153,0.3)] hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                : "border-white/20 bg-transparent text-foreground hover:bg-white/5 dark:text-white",
            )}
            variant={isPrimaryCta ? "default" : "outline"}
            onClick={() => onSelect?.(effectiveCycle)}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
