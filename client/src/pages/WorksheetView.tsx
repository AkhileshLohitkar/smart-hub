import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useWorksheet } from "@/hooks/use-worksheets";
import { useUser } from "@/hooks/use-auth";
import { WorksheetRender } from "@/components/WorksheetRender";
import { StarRating } from "@/components/StarRating";
import { ArrowLeft, Printer, Download, Loader2, MessageSquare, Camera, Sparkles } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { type WorksheetWatermark, WATERMARK_MIN_SIZE, WATERMARK_MAX_SIZE } from "@shared/schema";

type PdfWatermark =
  | { kind: "image"; dataUrl: string; aspect: number; size: number }
  | { kind: "text"; text: string; size: number }
  | null;

function clampWatermarkSize(size: number | undefined): number {
  const n = Number(size);
  if (!Number.isFinite(n)) return WATERMARK_MAX_SIZE;
  return Math.min(WATERMARK_MAX_SIZE, Math.max(WATERMARK_MIN_SIZE, n));
}

async function loadImageAsPng(src: string): Promise<{ dataUrl: string; aspect: number } | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
  const w = img.naturalWidth || 200;
  const h = img.naturalHeight || 200;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    ctx.drawImage(img, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL("image/png"), aspect: w / h };
  } catch {
    return null;
  }
}

function fixMathSymbols(text: string) {
  return text
    .replace(/÷/g, "/")
    .replace(/×/g, "*")
    .replace(/−/g, "-")
    .replace(/√/g, "sqrt")
    .replace(/π/g, "pi");
}

function normalizeTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const t = node.nodeValue;
    if (t) node.nodeValue = fixMathSymbols(t);
    node = walker.nextNode();
  }
}

function shouldShowWatermark(user: any | null | undefined): boolean {
  if (!user) return true;
  const planType = String(user.planType || "").toLowerCase();
  const planName = String(user.planName || "").toLowerCase();
  // Free plan explicitly has watermark; paid plans are watermark-free.
  if (planType === "worksheet" && (planName === "free" || planName === "basic")) return true;
  if (planType === "worksheet" && planName) return false;
  // Fallback for legacy plans
  const legacyNoWatermark = ["no_watermark", "no_watermark_annual"];
  return !legacyNoWatermark.includes(String(user.plan || ""));
}

export default function WorksheetView() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const { data: worksheet, isLoading, isError } = useWorksheet(id);
  const { data: user } = useUser();
  const [userRating, setUserRating] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [contentUploadSuggestOpen, setContentUploadSuggestOpen] = useState(false);
  const showWatermark = shouldShowWatermark(user);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (worksheet?.worksheetType === "brain_flex" && id != null) {
      setLocation(`/brain-flex/${id}`);
    }
  }, [worksheet?.worksheetType, id, setLocation]);

  useEffect(() => {
    if (
      worksheet &&
      worksheet.rating === null &&
      worksheet.worksheetType !== "brain_flex"
    ) {
      const timer = setTimeout(() => {
        setRatingDialogOpen(true);
      }, 8000); // 8 seconds
  
      return () => clearTimeout(timer);
    }
  }, [worksheet]);

  useEffect(() => {
    if (user && user.worksheetsGenerated > 0 && user.worksheetsGenerated % 25 === 0) {
      const dismissedKey = `review_dismissed_${user.worksheetsGenerated}`;
      if (!sessionStorage.getItem(dismissedKey)) {
        const timer = setTimeout(() => setReviewDialogOpen(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await apiRequest("POST", `/api/worksheets/${id}/rate`, { rating });
      return res.json();
    },
    onSuccess: (_data, ratingValue) => {
      setRatingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [api.worksheets.get.path, id] });
      toast({ title: "Thanks for rating!", description: "Your feedback helps us improve." });
      if (ratingValue <= 3) {
        setTimeout(() => setContentUploadSuggestOpen(true), 700);
      }
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

  const addWatermarkToPage = (pdf: any, wm: PdfWatermark, pdfWidth: number, pdfHeight: number) => {
    if (!wm) return;
    if (wm.kind === "image") {
      const wmMaxSize = (120 * wm.size) / 100;
      let wmW: number, wmH: number;
      if (wm.aspect >= 1) {
        wmW = wmMaxSize;
        wmH = wmMaxSize / wm.aspect;
      } else {
        wmH = wmMaxSize;
        wmW = wmMaxSize * wm.aspect;
      }
      const wmX = (pdfWidth - wmW) / 2;
      const wmY = (pdfHeight - wmH) / 2;
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
      pdf.addImage(wm.dataUrl, "PNG", wmX, wmY, wmW, wmH);
      pdf.restoreGraphicsState();
    } else {
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: 0.08 }));
      pdf.setTextColor(60, 60, 60);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize((40 * wm.size) / 100);
      pdf.text(wm.text, pdfWidth / 2, pdfHeight / 2, {
        align: "center",
        angle: 30,
        baseline: "middle",
      } as any);
      pdf.restoreGraphicsState();
    }
  };

  const renderBlockToPdf = async (
    canvas: HTMLCanvasElement,
    pdf: any,
    margin: number,
    usableWidth: number,
    pdfHeight: number,
    scaleFactor: number,
    usableHeightMm: number,
    wm: PdfWatermark,
    isFirstBlock: boolean
  ) => {
    const sourcePageHeightPx = usableHeightMm / scaleFactor;
    const totalPages = Math.ceil(canvas.height / sourcePageHeightPx);

    for (let page = 0; page < totalPages; page++) {
      if (!(isFirstBlock && page === 0)) pdf.addPage();

      const sy = page * sourcePageHeightPx;
      const sh = Math.min(sourcePageHeightPx, canvas.height - sy);
      const sw = canvas.width;

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = sw;
      pageCanvas.height = sh;
      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(canvas, 0, sy, sw, sh, 0, 0, sw, sh);
      }

      const pageImgData = pageCanvas.toDataURL("image/png");
      const renderedHeight = sh * scaleFactor;
      pdf.addImage(pageImgData, "PNG", margin, margin, usableWidth, renderedHeight);

      addWatermarkToPage(pdf, wm, pdf.internal.pageSize.getWidth(), pdfHeight);
    }
  };

  const handleDownload = async () => {
    if (!worksheetRef.current) return;

    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = worksheetRef.current;

      const existingWatermarks = element.querySelectorAll('[data-testid="watermark-overlay"]');
      existingWatermarks.forEach((el: Element) => ((el as HTMLElement).style.display = "none"));

      const a4WidthPx = 794;
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pdfWidth - margin * 2;

      const wmConfig = (worksheet?.content as any)?.watermark as WorksheetWatermark | undefined;
      const customMode = wmConfig?.mode === "custom";
      const customLogo = customMode && wmConfig?.logo ? String(wmConfig.logo) : "";
      const customText = customMode && wmConfig?.text ? String(wmConfig.text).trim() : "";
      const customActive = customMode && (customLogo || customText);
      const wmSize = clampWatermarkSize(wmConfig?.size);

      let pdfWatermark: PdfWatermark = null;
      if (customActive) {
        if (customLogo) {
          const loaded = await loadImageAsPng(customLogo);
          if (loaded) pdfWatermark = { kind: "image", dataUrl: loaded.dataUrl, aspect: loaded.aspect, size: wmSize };
        } else {
          pdfWatermark = { kind: "text", text: customText, size: wmSize };
        }
      } else if (showWatermark) {
        const loaded = await loadImageAsPng(logoImage);
        if (loaded) pdfWatermark = { kind: "image", dataUrl: loaded.dataUrl, aspect: loaded.aspect, size: WATERMARK_MAX_SIZE };
      }

      const usableHeightMm = pdfHeight - margin * 2;

      const worksheetContent = element.querySelector("#worksheet-content") as HTMLElement;

      if (worksheetContent) {
        const clone = worksheetContent.cloneNode(true) as HTMLElement;
        clone.style.position = "fixed";
        clone.style.left = "-100000px";
        clone.style.top = "0";
        clone.style.width = `${a4WidthPx}px`;
        clone.style.background = "#ffffff";
        normalizeTextNodes(clone);
        document.body.appendChild(clone);

        let wsCanvas: HTMLCanvasElement;
        try {
          wsCanvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            windowWidth: a4WidthPx,
            width: a4WidthPx,
          });
        } finally {
          clone.remove();
        }
        const wsScale = usableWidth / wsCanvas.width;
        await renderBlockToPdf(
          wsCanvas,
          pdf,
          margin,
          usableWidth,
          pdfHeight,
          wsScale,
          usableHeightMm,
          pdfWatermark,
          true
        );
      }

      existingWatermarks.forEach((el: Element) => ((el as HTMLElement).style.display = ""));

      const fileName = `QikWorksheet_${worksheet?.subject}_${worksheet?.topic}_${id}.pdf`;
      pdf.save(fileName.replace(/\s+/g, "_"));

      // Best-effort server-side activity log (download happens on the client).
      try {
        await fetch(`/api/worksheets/${id}/download`, { method: "POST" });
      } catch {
        // ignore
      }

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
          <Link href="/new-worksheet" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  const backHref =
    worksheet.worksheetType === "brain_flex" ? "/history?tab=brain-flex" : "/new-worksheet";

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50 shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Qik Worksheet" className="w-32 h-32 rounded-md object-contain drop-shadow-md logo-vibrant" data-testid="logo-image" />
              <div>
                <h2 className="font-display font-bold text-sm hidden sm:block">{worksheet.subject} Worksheet</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-wider hidden sm:block">
                  {worksheet.topic} • {worksheet.difficulty}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
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
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Download className="w-4 h-4 mr-1.5" />}
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
            <Button variant="outline" onClick={() => setRatingDialogOpen(false)} data-testid="button-skip-rating">
              Skip
            </Button>
            <Button onClick={handleSubmitRating} disabled={userRating === 0 || rateMutation.isPending} data-testid="button-submit-rating">
              {rateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reviewDialogOpen}
        onOpenChange={(open) => {
          if (!open && user) {
            sessionStorage.setItem(`review_dismissed_${user.worksheetsGenerated}`, "true");
          }
          setReviewDialogOpen(open);
        }}
      >
        <DialogContent data-testid="dialog-review" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0066FF]" />
              We'd love your feedback
            </DialogTitle>
            <DialogDescription>
              You've generated {user?.worksheetsGenerated} worksheets! How's your experience so far?
            </DialogDescription>
          </DialogHeader>
          {reviewSubmitted ? (
            <div className="py-6 text-center">
              <p className="text-lg font-semibold text-[#0066FF] mb-1">Thank you!</p>
              <p className="text-sm text-muted-foreground">Your feedback helps us improve Qik Worksheets.</p>
            </div>
          ) : (
            <>
              <div className="py-3">
                <Textarea
                  placeholder="Any suggestions, issues, or things you love about the app? (optional)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-[100px] resize-none"
                  data-testid="input-review-text"
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (user) sessionStorage.setItem(`review_dismissed_${user.worksheetsGenerated}`, "true");
                    setReviewDialogOpen(false);
                  }}
                  data-testid="button-skip-review"
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={() => {
                    if (user) sessionStorage.setItem(`review_dismissed_${user.worksheetsGenerated}`, "true");
                    setReviewSubmitted(true);
                    toast({ title: "Feedback received!", description: "Thanks for helping us improve." });
                    setTimeout(() => setReviewDialogOpen(false), 2000);
                  }}
                  className="bg-[#0066FF] text-white hover:bg-[#0066FF]/90"
                  data-testid="button-submit-review"
                >
                  {reviewText.trim() ? "Submit Feedback" : "I'm Satisfied!"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={contentUploadSuggestOpen} onOpenChange={setContentUploadSuggestOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-content-upload-suggest">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-gradient-primary rounded-lg">
                <Camera className="w-4 h-4 text-white" />
              </div>
              Let's make it better!
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-1">
              We're sorry the worksheet didn't quite hit the mark. Here's a way to make future worksheets much more accurate for your child's specific textbook.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-gradient-to-br from-primary/5 to-pink-500/5 border border-primary/20 p-4">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> How "My Notes" helps
              </p>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    1
                  </span>
                  <span>Open your child's textbook to the chapter you need</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    2
                  </span>
                  <span>Take clear photos of each page in bright light (up to 10 pages)</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    3
                  </span>
                  <span>Upload them to "My Notes" — our AI reads and saves your exact book content</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    4
                  </span>
                  <span>Future worksheets for that topic will use your textbook's own words and examples</span>
                </li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              It only takes a few minutes and makes a big difference in worksheet quality.
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setContentUploadSuggestOpen(false)} data-testid="button-skip-content-suggest">
              Maybe Later
            </Button>
            <Link href="/my-notes">
              <Button
                className="bg-gradient-primary text-white font-semibold"
                onClick={() => setContentUploadSuggestOpen(false)}
                data-testid="button-go-my-notes"
              >
                <Camera className="w-4 h-4 mr-2" /> Upload My Textbook
              </Button>
            </Link>
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
