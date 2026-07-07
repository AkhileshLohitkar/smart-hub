import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FaqAnswer, FaqItem } from "@shared/faqData";

type FaqAccordionProps = {
  items: FaqItem[];
  className?: string;
};

function FaqAnswerContent({ answer }: { answer: FaqAnswer }) {
  if (answer.type === "text") {
    return <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{answer.text}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{answer.intro}</p>
      <ul className="space-y-2 pl-1">
        {answer.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm sm:text-base text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className={cn(
              "group rounded-2xl border transition-all duration-300",
              "bg-card/60 backdrop-blur-md dark:bg-[#0f0f18]/80",
              isOpen
                ? "border-pink-500/40 shadow-[0_0_0_1px_rgba(236,72,153,0.25),0_12px_40px_rgba(236,72,153,0.08)]"
                : "border-border/50 dark:border-white/10 hover:border-pink-500/25",
            )}
            data-testid={`faq-item-${item.id}`}
          >
            <button
              type="button"
              className="flex w-full items-start gap-4 px-5 py-5 sm:px-6 sm:py-6 text-left"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              data-testid={`faq-question-${item.id}`}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
                  "shadow-[0_0_12px_rgba(236,72,153,0.35)]",
                )}
              >
                {item.id}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-base sm:text-lg font-display font-bold text-foreground dark:text-white pr-2">
                  {item.question}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 text-pink-400 transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border/50 dark:border-white/10 px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 ml-11 sm:ml-12">
                  <div data-testid={`faq-answer-${item.id}`}>
                    <FaqAnswerContent answer={item.answer} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
