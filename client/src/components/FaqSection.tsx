import { Link } from "wouter";
import { HelpCircle, ArrowRight } from "lucide-react";
import { FaqAccordion } from "@/components/FaqAccordion";
import { FAQ_ITEMS } from "@shared/faqData";
import { cn } from "@/lib/utils";

type FaqSectionProps = {
  limit?: number;
  showViewAllLink?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
};

export function FaqSection({
  limit,
  showViewAllLink = false,
  className,
  title = "Frequently Asked Questions",
  subtitle = "Quick answers about Qik Worksheet",
}: FaqSectionProps) {
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS;

  return (
    <section className={cn("py-12 sm:py-16 lg:py-20 px-4 sm:px-6", className)} id="faq">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/25 bg-pink-500/5 px-4 py-1.5 text-xs font-semibold text-pink-400 mb-4">
            <HelpCircle className="h-3.5 w-3.5" />
            FAQs
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 sm:mb-4 px-2">
            {title.includes("Questions") ? (
              <>
                Frequently Asked{" "}
                <span className="text-gradient-primary">Questions</span>
              </>
            ) : (
              title
            )}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
              {subtitle}
            </p>
          )}
        </div>

        <FaqAccordion items={items} />

        {showViewAllLink && (
          <div className="mt-8 sm:mt-10 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-gradient-primary hover:opacity-90 transition-opacity"
              data-testid="link-view-all-faqs"
            >
              View All FAQs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
