import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, Sparkles, Crown, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { motion } from "framer-motion";

const planDetails: Record<string, { label: string; perks: string[] }> = {
  starter: {
    label: "Starter",
    perks: ["Unlimited worksheets", "All boards & subjects", "Print & download", "Priority support"],
  },
  starter_annual: {
    label: "Starter Annual",
    perks: ["Unlimited worksheets", "All boards & subjects", "Print & download", "Priority support", "Save ₹189/year"],
  },
  family: {
    label: "Family",
    perks: ["Unlimited worksheets", "Up to 3 child profiles", "All boards & subjects", "Priority support"],
  },
  family_annual: {
    label: "Family Annual",
    perks: ["Unlimited worksheets", "Up to 3 child profiles", "All boards & subjects", "Premium support", "Save ₹469/year"],
  },
  no_watermark: {
    label: "No Watermark",
    perks: ["Unlimited worksheets", "No watermark on worksheets", "Unlimited child profiles", "All boards & subjects", "Premium support"],
  },
};

export default function PaymentSuccess() {
  const { data: user, isLoading } = useUser();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const userPlan = user?.plan || "starter";
  const details = planDetails[userPlan] || planDetails.starter;
  const params = new URLSearchParams(window.location.search);
  const planNameFromUrl = params.get("plan");
  const displayName = details?.label || planNameFromUrl || "Premium";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-purple-950/30 dark:to-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                backgroundColor: ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#3B82F6', '#EAB308'][i % 6],
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              }}
              transition={{
                duration: 2.5 + Math.random() * 2,
                delay: Math.random() * 1.5,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-border relative z-10"
      >
        <img src={logoImage} alt="Qik Worksheet" className="w-32 h-32 mx-auto mb-4 rounded-lg object-contain logo-vibrant" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-5"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Congratulations!</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>

          <h2 className="text-3xl font-display font-bold mb-2 text-gradient-primary" data-testid="text-payment-success">
            Payment Successful!
          </h2>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-primary text-white font-semibold text-sm mb-4 shadow-md">
            <Crown className="w-4 h-4" />
            <span data-testid="text-active-plan">{displayName} Plan Active</span>
          </div>

          <p className="text-muted-foreground mb-6">
            Welcome to your upgraded experience, <span className="font-semibold text-foreground">{user?.name || "User"}</span>!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-2xl p-5 mb-6 text-left"
        >
          <h3 className="font-semibold text-sm text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Your plan includes:
          </h3>
          <ul className="space-y-2">
            {details.perks.map((perk, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-2 text-sm text-purple-900 dark:text-purple-200"
              >
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                {perk}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {user?.planExpiresAt && (
          <p className="text-xs text-muted-foreground mb-4" data-testid="text-plan-expiry">
            Plan valid until: <span className="font-medium">{new Date(user.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Link href="/dashboard">
            <Button className="bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 w-full h-12 text-base shadow-lg" data-testid="button-go-dashboard">
              Start Creating Worksheets <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
