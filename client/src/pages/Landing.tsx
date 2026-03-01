import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Brain, Printer, CheckCircle, Star, BookOpen, Users, Download, Sparkles, ArrowRight, Shield, Zap, Quote, Loader2 } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PlanInfo {
  name: string;
  price: string;
  period: string;
  children: string;
  features: string[];
  highlight: boolean;
  badge: string;
  planKey: string;
}

const plans: PlanInfo[] = [
  {
    name: "Free",
    price: "₹0",
    period: "",
    children: "1 Child",
    features: ["5 worksheets total", "All subjects", "Print & download", "Basic support"],
    highlight: false,
    badge: "",
    planKey: "",
  },
  {
    name: "Starter",
    price: "₹99",
    period: "/month",
    children: "1 Child",
    features: ["Unlimited worksheets", "All boards & subjects", "Print & download", "Priority support"],
    highlight: false,
    badge: "",
    planKey: "starter_monthly",
  },
  {
    name: "Starter Annual",
    price: "₹999",
    period: "/year",
    children: "1 Child",
    features: ["Unlimited worksheets", "All boards & subjects", "Print & download", "Priority support", "Save ₹189/year"],
    highlight: true,
    badge: "Best Value",
    planKey: "starter_annual",
  },
  {
    name: "Family",
    price: "₹189",
    period: "/month",
    children: "2-3 Children",
    features: ["Unlimited worksheets", "Multi-child profiles", "All boards & subjects", "Priority support"],
    highlight: false,
    badge: "",
    planKey: "family_monthly",
  },
  {
    name: "Family Annual",
    price: "₹1,799",
    period: "/year",
    children: "2-3 Children",
    features: ["Unlimited worksheets", "Multi-child profiles", "All boards & subjects", "Premium support", "Save ₹469/year"],
    highlight: false,
    badge: "Popular",
    planKey: "family_annual",
  },
  {
    name: "No Watermark",
    price: "₹349",
    period: "/year",
    children: "Unlimited Children",
    features: ["Unlimited worksheets", "No watermark on worksheets", "Clean print-ready output", "All boards & subjects", "Premium support"],
    highlight: true,
    badge: "Special",
    planKey: "no_watermark",
  },
];

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Generation",
    description: "Smart AI creates curriculum-aligned questions customized to your specific board, class, and topic.",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "All Indian Boards",
    description: "Full support for CBSE, ICSE, IGCSE, and State Board syllabi from Class 1 to 10.",
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "Instant Download",
    description: "Generate, rate, and download print-ready PDF worksheets in seconds.",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Colorful & Engaging",
    description: "Topic-relevant graphics and clean layouts that make learning fun for kids.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Quality Assured",
    description: "Every worksheet is reviewed for accuracy, difficulty level, and syllabus alignment.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Multiple Question Types",
    description: "MCQs, fill-in-the-blanks, short answers, long answers, and matching exercises.",
  },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Landing() {
  const { data: user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = useCallback(async (planKey: string) => {
    if (!user) {
      setLocation("/auth?tab=register");
      return;
    }

    setCheckoutLoading(planKey);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast({ title: "Error", description: "Could not load payment gateway. Please try again.", variant: "destructive" });
        setCheckoutLoading(null);
        return;
      }

      const orderRes = await apiRequest("POST", "/api/razorpay/create-order", { planKey });
      const orderData = await orderRes.json();

      if (!orderData.orderId) {
        toast({ title: "Error", description: orderData.message || "Could not create order.", variant: "destructive" });
        setCheckoutLoading(null);
        return;
      }

      const keyRes = await apiRequest("GET", "/api/razorpay/key");
      const keyData = await keyRes.json();

      const options = {
        key: keyData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Qik Worksheets",
        description: `${orderData.planName} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await apiRequest("POST", "/api/razorpay/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
              setLocation(`/payment/success?plan=${orderData.planName}`);
            } else {
              toast({ title: "Verification failed", description: "Payment could not be verified.", variant: "destructive" });
            }
          } catch {
            toast({ title: "Error", description: "Payment verification failed.", variant: "destructive" });
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#8B5CF6",
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch {
      toast({ title: "Checkout failed", description: "Could not start checkout. Please try again.", variant: "destructive" });
      setCheckoutLoading(null);
    }
  }, [user, setLocation, toast]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImage} alt="Qik Worksheet" className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg object-contain drop-shadow-md logo-vibrant" data-testid="logo-image" />
            <span className="text-lg sm:text-xl font-display font-bold text-gradient-primary" data-testid="logo-text">Qik Worksheets</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button className="bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base" data-testid="nav-dashboard">
                    Go to Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className="font-semibold text-sm sm:text-base" data-testid="nav-login">Log In</Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button className="bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base" data-testid="nav-signup">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-primary opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-warm opacity-5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <img src={logoImage} alt="Qik Worksheet" className="w-[28rem] h-[28rem] mx-auto mb-4 drop-shadow-xl object-contain logo-vibrant" data-testid="hero-logo" />
            </div>
            <Badge className="bg-gradient-primary text-white border-0 px-4 py-1.5 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI-Powered Education
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-tight mb-6">
              Create perfect{" "}
              <span className="text-gradient-primary">worksheets</span>
              <br />in seconds.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Qik Worksheets uses AI to generate curriculum-aligned, print-ready practice materials
              for CBSE, ICSE, IGCSE, and State Boards. Save hours of preparation time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?tab=register">
                <Button size="lg" className="bg-gradient-primary text-white font-bold rounded-xl text-lg px-8 py-6 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20" data-testid="hero-get-started">
                  Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="font-bold rounded-xl text-lg px-8 py-6 border-2" data-testid="hero-view-plans">
                  View Plans
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Why teachers & parents love <span className="text-gradient-primary">Qik Worksheets</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to create high-quality educational materials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow border-border/50">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold font-display mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4" id="pricing">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Simple, transparent <span className="text-gradient-primary">pricing</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start free. Upgrade when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card className={`p-6 h-full flex flex-col relative ${plan.highlight ? 'border-2 border-pink-500 shadow-lg shadow-pink-500/10' : 'border-border/50'}`}
                  data-testid={`plan-card-${plan.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-white border-0 text-xs">
                      {plan.badge}
                    </Badge>
                  )}
                  <h3 className="font-display font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{plan.children}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-display font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.planKey ? (
                    <Button
                      className={`w-full rounded-xl font-semibold ${plan.highlight ? 'bg-gradient-primary text-white hover:opacity-90' : ''}`}
                      variant={plan.highlight ? "default" : "outline"}
                      onClick={() => handleCheckout(plan.planKey)}
                      disabled={checkoutLoading === plan.planKey}
                      data-testid={`button-checkout-${plan.planKey}`}
                    >
                      {checkoutLoading === plan.planKey ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        "Choose Plan"
                      )}
                    </Button>
                  ) : (
                    <Link href="/auth?tab=register">
                      <Button
                        className="w-full rounded-xl font-semibold"
                        variant="outline"
                      >
                        Start Free
                      </Button>
                    </Link>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { step: "1", title: "Configure", desc: "Select board, class, subject, topic, and difficulty level." },
              { step: "2", title: "Generate", desc: "Our AI creates a perfectly aligned, print-ready worksheet." },
              { step: "3", title: "Download", desc: "Rate the worksheet, download as PDF, and print instantly." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-primary text-white font-display font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              What Parents & Teachers <span className="text-gradient-primary">Say</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trusted by educators and families across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Priya Sharma",
                role: "Parent",
                quote: "My daughter is in Grade 3 CBSE and these worksheets have been a lifesaver for her exam preparation. The questions are perfectly aligned with her syllabus.",
                stars: 5,
                initials: "PS",
                gradient: "from-pink-500 to-rose-500",
              },
              {
                name: "Rajesh Menon",
                role: "Teacher",
                quote: "As a maths teacher handling ICSE classes, I use Qik Worksheets daily to create practice sheets. It saves me at least 2 hours every day.",
                stars: 5,
                initials: "RM",
                gradient: "from-violet-500 to-purple-500",
              },
              {
                name: "Anita Desai",
                role: "Parent",
                quote: "Both my kids study in different boards - CBSE and IGCSE. This tool handles both perfectly. The difficulty levels are spot on.",
                stars: 5,
                initials: "AD",
                gradient: "from-amber-500 to-orange-500",
              },
              {
                name: "Suresh Iyer",
                role: "Teacher",
                quote: "The variety of question types - MCQs, fill in the blanks, short answers - makes it easy to prepare comprehensive worksheets for my State Board students.",
                stars: 4,
                initials: "SI",
                gradient: "from-emerald-500 to-teal-500",
              },
              {
                name: "Kavita Joshi",
                role: "Parent",
                quote: "I love that I can create worksheets for my KG child too. The tracing and matching activities are age-appropriate and keep my little one engaged.",
                stars: 5,
                initials: "KJ",
                gradient: "from-sky-500 to-blue-500",
              },
              {
                name: "Mohammed Farooq",
                role: "Teacher",
                quote: "Finally an Indian education tool that understands our curriculum. The CBSE and ICSE alignment is excellent. Highly recommend for all teachers.",
                stars: 5,
                initials: "MF",
                gradient: "from-rose-500 to-pink-500",
              },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full border-border/50" data-testid={`testimonial-card-${idx}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm" data-testid={`testimonial-name-${idx}`}>{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`testimonial-quote-${idx}`}>
                    {testimonial.quote}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
            Ready to save hours of preparation?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of teachers and parents who trust Qik Worksheets for quality educational materials.
          </p>
          <Link href="/auth?tab=register">
            <Button size="lg" className="bg-gradient-primary text-white font-bold rounded-xl text-lg px-10 py-6 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20" data-testid="cta-get-started">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Qik Worksheet" className="w-32 h-32 rounded-md object-contain drop-shadow-md logo-vibrant" />
            <span className="font-display font-bold text-gradient-primary">Qik Worksheets</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Qik Worksheets. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
