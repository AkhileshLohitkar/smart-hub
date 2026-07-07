import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FaqSection } from "@/components/FaqSection";

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src={logoImage}
              alt="Qik Worksheet"
              className="w-20 h-20 rounded-lg object-contain drop-shadow-md logo-vibrant"
            />
            <span className="text-lg font-display font-bold text-gradient-primary">Qik Worksheets</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container mx-auto max-w-3xl px-4 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <FaqSection subtitle="Everything you need to know about Qik Worksheet" className="pt-4" />
    </div>
  );
}
