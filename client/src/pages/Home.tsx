import { useEffect, useState } from "react";
import { WorksheetForm } from "@/components/WorksheetForm";
import { Sparkles, Brain, Printer, CheckCircle, Loader2, UserPlus, Crown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useChildren } from "@/hooks/use-children";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/AppNav";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { data: user, isLoading } = useUser();
  const { data: childrenData, isLoading: childrenLoading } = useChildren();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const [planBannerDismissed, setPlanBannerDismissed] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const features = [
    {
      icon: <Brain className="w-5 h-5 text-white" />,
      title: "AI-Powered Generation",
      description: "Generates curriculum-aligned questions customized to your specific needs."
    },
    {
      icon: <Printer className="w-5 h-5 text-white" />,
      title: "Print-Ready Output",
      description: "Perfectly formatted A4 layouts with spacing lines for written answers."
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-white" />,
      title: "Tailored Difficulty",
      description: "Instantly adjust complexity for different grade levels and boards."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-gradient-primary opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-gradient-warm opacity-5 rounded-full blur-3xl pointer-events-none" />

      <AppNav user={user} onLogout={() => logoutMutation.mutate()} />

      <AnimatePresence>
        {!childrenLoading && user && (!childrenData || childrenData.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-b border-purple-200 dark:border-purple-800"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-primary rounded-full p-2">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                  Add your child's profile to get started with personalized worksheets
                </p>
              </div>
              <Link href="/children">
                <Button size="sm" className="bg-gradient-primary text-white rounded-lg text-xs hover:opacity-90" data-testid="button-add-child-banner">
                  Add Child Profile
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
        {user && user.plan === "free" && !planBannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-b border-amber-200 dark:border-amber-800"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-2">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Upgrade your plan for unlimited worksheets and more child profiles
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/#pricing">
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs hover:opacity-90" data-testid="button-upgrade-banner">
                    View Plans
                  </Button>
                </Link>
                <button onClick={() => setPlanBannerDismissed(true)} className="text-amber-400 hover:text-amber-600 p-1" data-testid="button-dismiss-plan-banner">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-5 flex flex-col justify-center pt-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-primary text-white font-medium text-sm w-fit mb-6 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Smart Educational Tool
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight mb-6 text-foreground">
              Create perfect <span className="text-gradient-primary relative whitespace-nowrap">
                worksheets
                <span className="absolute bottom-1 left-0 w-full h-3 bg-pink-500/15 -z-10 rounded-sm skew-x-6"></span>
              </span> in seconds.
            </h1>

            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg">
              Save hours of preparation time. Define your topic, curriculum, and difficulty level, and let our AI generate rigorous, print-ready practice materials instantly.
            </p>

            <div className="space-y-6">
              {features.map((feature, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + (idx * 0.1) }}
                  key={idx}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 bg-gradient-primary shadow-sm rounded-lg p-2.5">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-7 w-full max-w-2xl mx-auto"
          >
            <WorksheetForm />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
