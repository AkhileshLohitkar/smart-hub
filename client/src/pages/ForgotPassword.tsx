import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  const supportMailto = `mailto:hi@qikworksheet.in?subject=${encodeURIComponent(`Password reset request — ${email}`)}&body=${encodeURIComponent(
    `Please help me regain access to my Qik Worksheets account.\n\nRegistered email: ${email}\n`,
  )}`;

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
          {!isSubmitted ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">Forgot password?</h2>
                <p className="text-sm text-muted-foreground">
                  Automated reset links are not available yet. Enter your email — on the next step you can email our team and
                  we will help you regain access.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  data-testid="button-send-reset"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Continue…
                    </>
                  ) : (
                    "Continue"
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
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Next step</h3>
              <p className="text-sm text-muted-foreground mb-2">
                We have not sent an automated email. Use the button below to open your mail app with a draft to{" "}
                <span className="font-semibold text-foreground">hi@qikworksheet.in</span> for account{" "}
                <span className="font-semibold text-foreground">{email}</span>.
              </p>
              <p className="text-xs text-muted-foreground mb-6">If nothing opens, copy the address manually from your inbox app.</p>
              <a href={supportMailto} className="block w-full mb-3">
                <Button
                  type="button"
                  className="w-full bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90"
                  data-testid="button-open-email"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email support
                </Button>
              </a>
              <Link href="/auth">
                <Button variant="outline" className="w-full rounded-xl" data-testid="button-back-login-after">
                  Back to sign in
                </Button>
              </Link>
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
