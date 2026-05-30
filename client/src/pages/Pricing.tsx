import { useLogout, useUser } from "@/hooks/use-auth";
import { AppNav } from "@/components/AppNav";
import { PricingPlansSection } from "@/components/PricingPlansSection";

export default function Pricing() {
  const { data: user } = useUser();
  const logoutMutation = useLogout();

  return (
    <div className="min-h-screen bg-background">
      {user ? <AppNav user={user} onLogout={() => logoutMutation.mutate()} /> : null}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PricingPlansSection headerVariant="page" showPaymentRecover />
      </div>
    </div>
  );
}
