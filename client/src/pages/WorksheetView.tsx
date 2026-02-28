import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useWorksheet } from "@/hooks/use-worksheets";
import { useUser } from "@/hooks/use-auth";
import { WorksheetRender } from "@/components/WorksheetRender";
import { StarRating } from "@/components/StarRating";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import logoImage from "@assets/IMG_6540_1772307045625.PNG";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NO_WATERMARK_PLANS = ["no_watermark", "no_watermark_annual"];

export default function WorksheetView() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const { data: worksheet, isLoading, isError } = useWorksheet(id);
  const { data: user } = useUser();
  const [userRating, setUserRating] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const showWatermark = !user || !NO_WATERMARK_PLANS.includes(user.plan);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (worksheet && !worksheet.rating) {
      setRatingDialogOpen(true);
    }
  }, [worksheet]);

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await apiRequest("POST", `/api/worksheets/${id}/rate`, { rating });
      return res.json();
    },
    onSuccess: () => {
      setRatingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/worksheets", id] });
      toast({ title: "Thanks for rating!", description: "Your feedback helps us improve." });
    },
  });

  const handleSubmitRating = () => {
    if (userRating > 0) {
      rateMutation.mutate(userRating);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!worksheetRef.current) return;

    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = worksheetRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const usableWidth = pdfWidth - margin * 2;
      const ratio = usableWidth / canvas.width;
      const scaledHeight = canvas.height * ratio;

      let yOffset = 0;
      let page = 0;

      while (yOffset < scaledHeight) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, -yOffset, usableWidth, scaledHeight);
        yOffset += pdfHeight;
        page++;
      }

      const fileName = `QikWorksheet_${worksheet?.subject}_${worksheet?.topic}_${id}.pdf`;
      pdf.save(fileName.replace(/\s+/g, "_"));

      toast({ title: "Downloaded!", description: "Your worksheet PDF has been saved." });
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF. Try using Print instead.",
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
        <h2 className="text-xl font-display font-semibold">Retrieving Worksheet...</h2>
        <p className="text-muted-foreground mt-2">Loading your generated content</p>
      </div>
    );
  }

  if (isError || !worksheet) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md text-center border border-border">
          <h2 className="text-2xl font-display font-bold text-destructive mb-3">Worksheet Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't locate the worksheet you're looking for.</p>
          <Link href="/dashboard" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <div className="bg-white/80 backdrop-blur-lg border-b border-border/50 shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Qik Worksheet" className="w-16 h-16 rounded-md object-contain drop-shadow-md logo-vibrant" data-testid="logo-image" />
              <div>
                <h1 className="font-display font-bold text-sm hidden sm:block">
                  {worksheet.subject} Worksheet
                </h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider hidden sm:block">
                  {worksheet.topic} • {worksheet.difficulty}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl font-semibold border-2"
              data-testid="button-print"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              data-testid="button-download"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent data-testid="dialog-rate-worksheet">
          <DialogHeader>
            <DialogTitle>Rate this Worksheet</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground">How would you rate the quality of this worksheet?</p>
            <StarRating rating={userRating} onRate={setUserRating} size="lg" />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setRatingDialogOpen(false)}
              data-testid="button-skip-rating"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={userRating === 0 || rateMutation.isPending}
              data-testid="button-submit-rating"
            >
              {rateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1 py-10 px-4 sm:px-8 overflow-y-auto print:p-0 print:overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="print:shadow-none"
          ref={worksheetRef}
        >
          <WorksheetRender worksheet={worksheet} showWatermark={showWatermark} />
        </motion.div>
      </main>
    </div>
  );
}
