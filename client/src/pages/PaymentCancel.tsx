import { Link } from "wouter";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/IMG_6540_1772307045625.PNG";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-border">
        <img src={logoImage} alt="Qik Worksheet" className="w-16 h-16 mx-auto mb-4 rounded-lg object-contain logo-vibrant" />
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <XCircle className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Payment Cancelled</h2>
        <p className="text-muted-foreground mb-6">
          No worries — you weren't charged. You can upgrade anytime from the plans page.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/#pricing">
            <Button className="bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 w-full" data-testid="button-view-plans">
              View Plans Again
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-xl font-semibold w-full" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
