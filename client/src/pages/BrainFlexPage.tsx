import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useWorksheet } from "@/hooks/use-worksheets";
import { useUser } from "@/hooks/use-auth";
import BrainFlexRender from "@/components/BrainFlexRender";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { downloadBrainFlexPdf } from "@/lib/brainFlexPdf";

function shouldShowWatermark(user: any | null | undefined): boolean {
  if (!user) return true;
  const planType = String(user.planType || "").toLowerCase();
  const planName = String(user.planName || "").toLowerCase();
  if (planType === "worksheet" && (planName === "free" || planName === "basic")) return true;
  if (planType === "worksheet" && planName) return false;
  const legacyNoWatermark = ["no_watermark", "no_watermark_annual"];
  return !legacyNoWatermark.includes(String(user.plan || ""));
}

export default function BrainFlexPage() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const { data: worksheet, isLoading, isError } = useWorksheet(id);
  const { data: user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const showWatermark = shouldShowWatermark(user);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!worksheet || isLoading) return;
    if (worksheet.worksheetType !== "brain_flex") {
      setLocation(`/worksheet/${worksheet.id}`);
    }
  }, [worksheet, isLoading, setLocation]);

  const handleDownload = async () => {
    if (!worksheet || id == null) return;
    setIsDownloading(true);
    try {
      await downloadBrainFlexPdf(worksheet as any, id, toast);
    } catch (e) {
      console.error(e);
      toast({
        title: "Download Failed",
        description: "Could not generate Brain-Flex PDF.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <h2 className="text-xl font-display font-semibold">Loading Brain-Flex…</h2>
      </div>
    );
  }

  if (isError || !worksheet) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md text-center border border-border">
          <h2 className="text-2xl font-display font-bold text-destructive mb-3">Not Found</h2>
          <Link href="/brain-flex" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Brain-Flex
          </Link>
        </div>
      </div>
    );
  }

  if (worksheet.worksheetType !== "brain_flex") {
    return null;
  }

  const backHref = "/history?tab=brain-flex";

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col brain-flex-print-root">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50 shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={backHref} className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Qik Worksheet" className="w-32 h-32 rounded-md object-contain drop-shadow-md logo-vibrant" />
              <div>
                <h2 className="font-display font-bold text-sm hidden sm:block">Brain-Flex</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden sm:block">
                  {worksheet.topic} • {worksheet.difficulty}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden sm:inline-flex">
              <Printer className="w-4 h-4 mr-1.5" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-gradient-primary text-white rounded-xl font-semibold"
              data-testid="button-brainflex-download"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Download className="w-4 h-4 mr-1.5" />}
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 py-10 px-4 sm:px-8 overflow-y-auto print:p-0 print:py-0 print:overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="print:shadow-none max-w-4xl mx-auto"
          id="worksheet-content"
          ref={contentRef}
        >
          {showWatermark && (
            <div className="hidden print:block text-center text-[10px] text-muted-foreground mb-2">Preview — upgrade to remove watermark</div>
          )}
          <BrainFlexRender worksheet={worksheet} />
        </motion.div>
      </main>
    </div>
  );
}
