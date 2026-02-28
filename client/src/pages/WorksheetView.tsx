import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useWorksheet } from "@/hooks/use-worksheets";
import { WorksheetRender } from "@/components/WorksheetRender";
import { StarRating } from "@/components/StarRating";
import { ArrowLeft, Printer, Download, Loader2, BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WorksheetView() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const { data: worksheet, isLoading, isError } = useWorksheet(id);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await apiRequest("POST", `/api/worksheets/${id}/rate`, { rating });
      return res.json();
    },
    onSuccess: () => {
      setHasRated(true);
      queryClient.invalidateQueries({ queryKey: ["/api/worksheets", id] });
      toast({ title: "Thanks for rating!", description: "Your feedback helps us improve." });
    },
  });

  const handleRate = (rating: number) => {
    setUserRating(rating);
    rateMutation.mutate(rating);
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
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const x = (pdfWidth - imgWidth * ratio) / 2;

      let heightLeft = imgHeight * ratio;
      let position = 0;

      pdf.addImage(imgData, "PNG", x, position, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", x, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
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

  const currentRating = worksheet.rating || userRating;
  const showRatingPrompt = !worksheet.rating && !hasRated;

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
              <div className="w-7 h-7 rounded-md bg-gradient-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
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

      {showRatingPrompt && (
        <div className="no-print">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-50 to-orange-50 border-b border-pink-100"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <p className="text-sm font-medium text-foreground">How would you rate this worksheet?</p>
              <StarRating rating={userRating} onRate={handleRate} size="md" />
            </div>
          </motion.div>
        </div>
      )}

      {hasRated && (
        <div className="no-print">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">Thanks for your rating! You can now download your worksheet.</p>
            </div>
          </motion.div>
        </div>
      )}

      <main className="flex-1 py-10 px-4 sm:px-8 overflow-y-auto print:p-0 print:overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="print:shadow-none"
          ref={worksheetRef}
        >
          <WorksheetRender worksheet={worksheet} />
        </motion.div>
      </main>
    </div>
  );
}
