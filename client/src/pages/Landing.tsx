import { Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, Printer, CheckCircle, Star, BookOpen, Users, Download, Sparkles, ArrowRight, Shield, Zap, Quote } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-auth";
import { PricingPlansSection } from "@/components/PricingPlansSection";
import { FaqSection } from "@/components/FaqSection";
import { LandingPromoSection } from "@/components/LandingPromoSection";
import { cn } from "@/lib/utils";

const landingSectionPad = "py-12 sm:py-16 lg:py-20 px-4 sm:px-6";
/** Existing homepage section backgrounds — alternate A → B → A … */
const landingSectionBgA = "bg-background";
const landingSectionBgB = "bg-muted/30";

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Generation",
    description: "Smart AI creates curriculum-aligned questions customized to your specific board, class, and topic.",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "All Indian Boards",
    description: "Full support for CBSE and State Board syllabi from Class 1 to 10.",
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

export default function Landing() {
  const { data: user } = useUser();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-[4.5rem] flex items-center justify-between gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden mr-1 sm:mr-2">
            <img
              src={logoImage}
              alt="Qik Worksheet"
              className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-lg object-contain drop-shadow-md logo-vibrant shrink-0"
              data-testid="logo-image"
            />
            <span
              className="truncate text-sm sm:text-base md:text-lg lg:text-xl font-display font-bold text-gradient-primary min-w-0"
              data-testid="logo-text"
            >
              Qik Worksheets
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            <ThemeToggle />
            {user ? (
              <Link href="/new-worksheet">
                <Button
                  className="bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm md:text-base"
                  data-testid="nav-dashboard"
                >
                  <span className="hidden sm:inline">Go to Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    className="font-semibold h-9 px-2 text-xs sm:h-10 sm:px-3 sm:text-sm md:text-base"
                    data-testid="nav-login"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button
                    className="bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity h-9 px-2.5 text-xs sm:h-10 sm:px-4 sm:text-sm md:text-base whitespace-nowrap"
                    data-testid="nav-signup"
                  >
                    <span className="hidden sm:inline">Sign Up Free</span>
                    <span className="sm:hidden">Sign Up</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="pt-[4.75rem] sm:pt-24 md:pt-28 pb-10 sm:pb-14 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] lg:w-[600px] lg:h-[600px] bg-gradient-primary opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[240px] h-[240px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-gradient-warm opacity-5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-2 sm:mb-3">
              <img
                src={logoImage}
                alt="Qik Worksheet"
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 mx-auto mb-2 drop-shadow-xl object-contain logo-vibrant"
                data-testid="hero-logo"
              />
            </div>
            <Badge className="bg-gradient-primary text-white border-0 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              AI-Powered Education
            </Badge>

            <h1 className="text-[1.75rem] leading-tight sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold mb-3 sm:mb-4 px-1">
              Create perfect{" "}
              <span className="text-gradient-primary">worksheets</span>{" "}
              in seconds.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-5 sm:mb-6 leading-relaxed px-1 sm:px-2">
              Qik Worksheets uses AI to generate curriculum-aligned, print-ready practice materials
              for CBSE and State Board. Save hours of preparation time.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-sm sm:max-w-none mx-auto px-2 sm:px-0">
              <Link href="/auth?tab=register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-primary text-white font-bold rounded-xl text-base sm:text-lg px-6 sm:px-8 py-5 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20"
                  data-testid="hero-get-started"
                >
                  Try For Free <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#pricing" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto font-bold rounded-xl text-base sm:text-lg px-6 sm:px-8 py-5 border-2"
                  data-testid="hero-view-plans"
                >
                  View Plans
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingPromoSection className={landingSectionBgB} />

      <section className={cn(landingSectionPad, landingSectionBgA)}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12 lg:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 sm:mb-4 px-2">
              Why teachers & parents love <span className="text-gradient-primary">Qik Worksheets</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
              Everything you need to create high-quality educational materials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      <section className={cn(landingSectionPad, landingSectionBgB)} id="pricing">
        <div className="container mx-auto max-w-6xl">
          <PricingPlansSection headerVariant="landing" showPaymentRecover={!!user} />
        </div>
      </section>

      <FaqSection limit={5} showViewAllLink className={landingSectionBgA} />

      <section className={cn(landingSectionPad, landingSectionBgB)}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 sm:mb-4 px-2">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
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

      <section className={cn(landingSectionPad, landingSectionBgA)}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12 lg:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 sm:mb-4 px-2">
              What Parents & Teachers <span className="text-gradient-primary">Say</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
              Trusted by educators and families across India.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      <section className={cn(landingSectionPad, landingSectionBgB)}>
        <div className="container mx-auto max-w-3xl text-center px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 sm:mb-6">
            Ready to save hours of preparation?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8">
            Join thousands of teachers and parents who trust Qik Worksheets for quality educational materials.
          </p>
          <Link href="/auth?tab=register" className="inline-block w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-primary text-white font-bold rounded-xl text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20"
              data-testid="cta-get-started"
            >
              Try For Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
