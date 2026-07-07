import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Step = "email" | "otp" | "done";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email: email.trim() });
      const data = await res.json();
      setStep("otp");
      toast({
        title: data.emailSent === false ? "OTP not emailed" : "OTP sent",
        description: data.message,
        variant: data.emailSent === false ? "destructive" : "default",
      });
    } catch (err) {
      let description = err instanceof Error ? err.message : "Could not send OTP.";
      const jsonMatch = description.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]) as { message?: string; hint?: string };
          description = [parsed.message, parsed.hint].filter(Boolean).join(" ");
        } catch {
          // keep raw message
        }
      }
      toast({
        title: "Could not send OTP",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email: email.trim() });
      const data = await res.json();
      toast({
        title: "OTP resent",
        description: data.message,
      });
    } catch (err) {
      toast({
        title: "Request failed",
        description: err instanceof Error ? err.message : "Could not resend OTP.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        password,
      });
      const data = await res.json();
      setStep("done");
      toast({
        title: "Password updated",
        description: data.message,
      });
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Could not reset password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-primary opacity-5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-warm opacity-5 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="flex justify-end mb-2">
            <ThemeToggle />
          </div>
          <Link href="/" className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <img
              src={logoImage}
              alt="Qik Worksheets"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-contain drop-shadow-lg logo-vibrant"
              data-testid="logo-image"
            />
            <span className="text-2xl font-display font-bold text-gradient-primary">Qik Worksheets</span>
          </Link>
        </div>

        <Card className="p-6 shadow-xl border-border/50">
          {step === "email" && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">Forgot password?</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send a 6-digit OTP to reset your password.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="text-sm font-semibold text-foreground mb-2 block">
                    Email address
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                    data-testid="input-forgot-email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity h-12"
                  disabled={isLoading}
                  data-testid="button-send-otp"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending OTP…
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                    data-testid="button-back-to-auth"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </button>
                </Link>
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">Enter OTP</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-foreground">{email}</span>. Enter it below with your new
                  password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-otp" className="text-sm font-semibold text-foreground mb-2 block">
                    OTP code
                  </label>
                  <Input
                    id="forgot-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="h-12 tracking-[0.3em] text-center text-lg font-semibold"
                    data-testid="input-forgot-otp"
                  />
                </div>

                <div>
                  <label htmlFor="forgot-new-password" className="text-sm font-semibold text-foreground mb-2 block">
                    New password
                  </label>
                  <div className="relative">
                    <Input
                      id="forgot-new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 pr-10"
                      data-testid="input-forgot-new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="forgot-confirm-password" className="text-sm font-semibold text-foreground mb-2 block">
                    Confirm password
                  </label>
                  <Input
                    id="forgot-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12"
                    data-testid="input-forgot-confirm-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity h-12"
                  disabled={isLoading}
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating password…
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setStep("email")}
                >
                  Change email
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline disabled:opacity-50"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  data-testid="button-resend-otp"
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          {step === "done" && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Password updated</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Button
                className="w-full bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90"
                onClick={() => setLocation("/auth")}
                data-testid="button-back-login-after"
              >
                Go to sign in
              </Button>
            </motion.div>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
