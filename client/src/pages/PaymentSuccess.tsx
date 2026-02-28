import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import logoImage from "@assets/IMG_6540_1772307045625.PNG";

export default function PaymentSuccess() {
  const [status, setStatus] = useState<"success" | "error">("success");
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    if (plan) {
      setPlanName(plan);
    }
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-border">
        <img src={logoImage} alt="Qik Worksheet" className="w-16 h-16 mx-auto mb-4 rounded-lg object-contain logo-vibrant" />

        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2 text-green-700" data-testid="text-payment-success">Payment Successful!</h2>
        <p className="text-muted-foreground mb-2">
          Your <span className="font-semibold capitalize">{planName || "premium"}</span> plan is now active.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Enjoy unlimited worksheet generation with your new plan.
        </p>
        <Link href="/dashboard">
          <Button className="bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 w-full" data-testid="button-go-dashboard">
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
