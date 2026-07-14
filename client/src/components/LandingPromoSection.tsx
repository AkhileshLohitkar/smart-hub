import { cn } from "@/lib/utils";
import landingPromoImage from "@assets/landing-promo-qik-worksheet.png";

export const LANDING_PROMO_YOUTUBE_VIDEO_ID = "MSUrWYFE-Hw";

const mediaFrameClass = cn(
  "overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm",
  "shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
  "dark:border-white/10",
);

export function LandingPromoSection({ className }: { className?: string }) {
  const youtubeEmbedUrl = `https://www.youtube-nocookie.com/embed/${LANDING_PROMO_YOUTUBE_VIDEO_ID}?rel=0`;

  return (
    <section
      className={cn("py-12 sm:py-16 lg:py-20 px-4 sm:px-6", className)}
      aria-label="Qik Worksheets promotional showcase"
      data-testid="landing-promo-section"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
          <div>
            <div className={cn(mediaFrameClass, "relative aspect-video w-full")}>
              <img
                src={landingPromoImage}
                alt="Create worksheets for any board and any subject with Qik Worksheets — in seconds, not hours"
                className="absolute inset-0 h-full w-full object-contain"
                data-testid="landing-promo-image"
              />
            </div>
          </div>

          <div>
            <div className={cn(mediaFrameClass, "relative aspect-video w-full")}>
              <iframe
                src={youtubeEmbedUrl}
                title="Qik Worksheets promotional video"
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                data-testid="landing-promo-video"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
