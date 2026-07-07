import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type TopUpPlan = {
  key: string;
  worksheets: number;
  price: number;
};

type TopUpSectionProps = {
  plans: TopUpPlan[];
  disabled?: boolean;
  topUpEnabled?: boolean;
  processingKey?: string | null;
  onSelect: (planKey: string, worksheets: number, price: number) => void;
  className?: string;
};

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function TopUpSection({
  plans,
  disabled,
  topUpEnabled = false,
  processingKey,
  onSelect,
  className,
}: TopUpSectionProps) {
  return (
    <section className={cn("mt-16 sm:mt-20", className)}>
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/25 bg-pink-500/5 px-4 py-1.5 text-xs font-semibold text-pink-400 mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Extra worksheets anytime
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold">
          Top-<span className="text-gradient-primary">Up</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-lg mx-auto">
          Need more worksheets? Add a one-time top-up to your active plan.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {plans.map((plan) => {
          const isProcessing = processingKey === plan.key;
          const canBuy = topUpEnabled && !disabled && !isProcessing;

          return (
            <Card
              key={plan.key}
              data-testid={`topup-card-${plan.key}`}
              className={cn(
                "relative flex flex-col items-center rounded-2xl border px-6 py-8 text-center",
                "bg-card/60 backdrop-blur-md dark:bg-[#0f0f18]/80 dark:border-white/10",
                "dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
                "transition-all duration-300 hover:-translate-y-1",
                canBuy && "hover:dark:border-pink-500/30 cursor-pointer",
                !topUpEnabled && "opacity-80",
              )}
              onClick={() => {
                if (canBuy) onSelect(plan.key, plan.worksheets, plan.price);
              }}
            >
              <div className="pointer-events-none absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl" />

              <p className="text-3xl font-bold text-foreground dark:text-white">
                {plan.worksheets}
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-1">Worksheets</p>

              <div className="my-5 h-px w-12 bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />

              <p className="text-2xl font-bold text-gradient-primary">{formatInr(plan.price)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">One-time purchase</p>

              <Button
                className={cn(
                  "mt-6 h-10 w-full rounded-xl text-sm font-semibold transition-all",
                  canBuy
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_16px_rgba(236,72,153,0.3)] hover:shadow-[0_0_22px_rgba(236,72,153,0.45)]"
                    : "border-white/15 bg-transparent text-muted-foreground",
                )}
                variant={canBuy ? "default" : "outline"}
                disabled={!canBuy}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canBuy) onSelect(plan.key, plan.worksheets, plan.price);
                }}
              >
                {isProcessing ? "Opening payment…" : topUpEnabled ? "Buy top-up" : "Subscribe first"}
              </Button>
            </Card>
          );
        })}
      </div>

      {!topUpEnabled && (
        <p className="text-center text-xs text-muted-foreground mt-6 max-w-md mx-auto">
          Top-ups unlock after you subscribe to any paid plan.
        </p>
      )}
    </section>
  );
}
