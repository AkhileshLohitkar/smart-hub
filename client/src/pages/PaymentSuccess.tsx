import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoImage from "@assets/IMG_6540_1772307045625.PNG";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setStatus("error");
      return;
    }

    apiRequest("POST", "/api/stripe/verify-session", { sessionId })
      .then(async (res) => {
        const data = await res.json();
        if (data.success) {
          setPlanName(data.user?.plan || "premium");
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-border">
        <img src={logoImage} alt="Qik Worksheet" className="w-16 h-16 mx-auto mb-4 rounded-lg object-contain logo-vibrant" />

        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-display font-bold mb-2">Verifying Payment...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your subscription.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2 text-green-700">Payment Successful!</h2>
            <p className="text-muted-foreground mb-2">
              Your <span className="font-semibold capitalize">{planName}</span> plan is now active.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Enjoy unlimited worksheet generation with your new plan.
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 w-full" data-testid="button-go-dashboard">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-2xl font-display font-bold mb-2 text-destructive">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't verify your payment. If you were charged, please contact support.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-xl font-semibold w-full" data-testid="button-go-dashboard-error">
                Return to Dashboard
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
