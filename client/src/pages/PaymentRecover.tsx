import { useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { motion } from "framer-motion";

export default function PaymentRecover() {
  const { data: user } = useUser();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [planName, setPlanName] = useState("");
  const [error, setError] = useState("");

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await apiRequest("POST", "/api/razorpay/recover-payment", { orderId: orderId.trim() });
      const data = await res.json();
      if (data.success) {
        setPlanName(data.plan);
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        setError(data.message || "Could not recover payment. Please contact support.");
      }
    } catch (err: any) {
      let msg = "Recovery failed. Please check your Order ID and try again.";
      try {
        const parsed = JSON.parse(err.message.split(": ").slice(1).join(": "));
        msg = parsed.message || msg;
      } catch {
        msg = err.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-purple-950/30 dark:to-gray-950 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Please Log In</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to recover a payment.</p>
          <Link href="/auth">
            <Button className="bg-gradient-primary text-white w-full">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-purple-950/30 dark:to-gray-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-border"
      >
        <div className="flex items-center gap-3 mb-6">
          <img src={logoImage} alt="Qik Worksheet" className="w-12 h-12 object-contain rounded-xl" />
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Recover Payment</h1>
            <p className="text-xs text-muted-foreground">Paid but plan not updated? Fix it here.</p>
          </div>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-400">Plan Recovered!</h2>
            <p className="text-muted-foreground mb-2">
              Your <span className="font-semibold capitalize">{planName.replace(/_/g, " ")}</span> plan has been activated successfully.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Logged in as <span className="font-medium">{user.email}</span>
            </p>
            <Link href="/new-worksheet">
              <Button className="bg-gradient-primary text-white w-full rounded-xl h-11">
                Go to Dashboard
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-semibold mb-1">When to use this</p>
                  <p>If you completed a Razorpay payment but your plan was not upgraded (e.g., your browser closed before the confirmation), enter your Razorpay Order ID below to restore your access.</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-4 mb-6 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">How to find your Order ID</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your Razorpay payment receipt (SMS / email)</li>
                <li>Look for a code starting with <code className="bg-muted px-1 rounded font-mono text-xs">order_</code></li>
                <li>Alternatively contact us at <a href="mailto:hi@qikworksheet.in" className="text-primary underline">hi@qikworksheet.in</a></li>
              </ol>
            </div>

            <form onSubmit={handleRecover} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="order-id" className="text-sm font-semibold">Razorpay Order ID</Label>
                <Input
                  id="order-id"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. order_AbCdEfGhIjKl12"
                  className="h-12 font-mono text-sm border-2 rounded-xl"
                  data-testid="input-order-id"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" data-testid="text-recover-error">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !orderId.trim()}
                className="w-full h-12 bg-gradient-primary text-white rounded-xl font-semibold"
                data-testid="button-recover-payment"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying…</>
                ) : (
                  <><Search className="w-4 h-4 mr-2" /> Recover My Plan</>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <Link href="/new-worksheet">
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-dashboard">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
