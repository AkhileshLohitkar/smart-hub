import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { AnswerSheet } from "@/components/WorksheetRender";
import BrainFlexRender from "@/components/BrainFlexRender";
import { fetchAnswerKey } from "@/lib/answerKeyApi";
import { useToast } from "@/hooks/use-toast";
import type { Worksheet } from "@shared/schema";

const YOUNG_CLASSES = ["Nursery", "KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

function getTitleFontClass(className: string) {
  return YOUNG_CLASSES.includes(className) ? "text-xl md:text-2xl" : "text-lg md:text-xl";
}

function getSubtitleFontClass(className: string) {
  return YOUNG_CLASSES.includes(className) ? "text-base md:text-lg" : "text-sm md:text-base";
}

/** Forces worksheet-style document colors regardless of site theme. */
const PAPER_CLASS =
  "bg-[#FFFFFF] text-[#000000] font-serif w-full max-w-4xl mx-auto min-h-[297mm] shadow-2xl p-6 md:p-10 rounded-sm relative " +
  "dark:bg-[#FFFFFF] dark:text-[#000000] print-a4 print:shadow-none print:m-0 print:p-6 print:rounded-none print:max-w-none";

const SECTIONS_CLASS =
  "[&_h3]:text-[10px] [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-gray-700 [&_h3]:mb-1 " +
  "dark:[&_h3]:text-gray-700 [&_.border]:border-gray-300 [&_.border]:bg-white dark:[&_.border]:bg-white dark:[&_.border]:border-gray-300 " +
  "[&_span]:text-gray-900 dark:[&_span]:text-gray-900 [&_p]:text-gray-900 dark:[&_p]:text-gray-900";

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

async function renderCanvasToPdf(
  canvas: HTMLCanvasElement,
  pdf: any,
  margin: number,
  usableWidth: number,
  pdfHeight: number,
  scaleFactor: number,
  usableHeightMm: number,
  isFirstBlock: boolean,
) {
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
  }
}

export default function AnswerKeyPage() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const answerKeyRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (id == null || !Number.isFinite(id)) {
      setError("Invalid worksheet reference");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchAnswerKey(id)
      .then((data) => {
        if (!cancelled) {
          setWorksheet(data);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load answer key");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const topicDisplay =
    worksheet && (worksheet.topic || worksheet.chapter)
      ? worksheet.chapter && worksheet.chapter !== worksheet.topic
        ? `${worksheet.chapter}: ${worksheet.topic}`
        : worksheet.topic || worksheet.chapter
      : null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!answerKeyRef.current || !worksheet || id == null) return;

    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const a4WidthPx = 794;
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const usableHeightMm = pdfHeight - margin * 2;

      const clone = answerKeyRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "-100000px";
      clone.style.top = "0";
      clone.style.width = `${a4WidthPx}px`;
      clone.style.background = "#ffffff";
      const pdfLogo = clone.querySelector("[data-answer-key-pdf-logo]") as HTMLElement | null;
      if (pdfLogo) pdfLogo.style.display = "flex";
      normalizeTextNodes(clone);
      document.body.appendChild(clone);

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(clone, {
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

      const scaleFactor = usableWidth / canvas.width;
      await renderCanvasToPdf(canvas, pdf, margin, usableWidth, pdfHeight, scaleFactor, usableHeightMm, true);

      const refLabel = (worksheet.serialNumber || `id${worksheet.id}`).replace(/\s+/g, "_");
      const subjectLabel = (worksheet.subject || "AnswerKey").replace(/\s+/g, "_");
      pdf.save(`QikWorksheet_AnswerKey_${subjectLabel}_${refLabel}.pdf`);

      toast({ title: "Downloaded!", description: "Your answer key PDF has been saved." });
    } catch (err) {
      console.error("Answer key download error:", err);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF. Try using Print instead.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const titleFont = worksheet ? getTitleFontClass(worksheet.className) : "text-lg md:text-xl";
  const subtitleFont = worksheet ? getSubtitleFontClass(worksheet.className) : "text-sm md:text-base";
  const boardLabel = (worksheet?.board || "GEN").toUpperCase();
  const difficultyLabel = (worksheet?.difficulty || "medium").toUpperCase();

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col print:bg-white">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50 shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <img
                src={logoImage}
                alt="Qik Worksheets"
                className="w-32 h-32 rounded-md object-contain drop-shadow-md logo-vibrant"
              />
              <div>
                <h2 className="font-display font-bold text-sm hidden sm:block">Answer Key</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-wider hidden sm:block">
                  {worksheet
                    ? `${worksheet.serialNumber || `#${worksheet.id}`} • ${worksheet.className}`
                    : "Loading…"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {worksheet && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="rounded-xl font-semibold border-2"
                  data-testid="button-print-answer-key"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  data-testid="button-download-answer-key"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Download className="w-4 h-4 mr-1.5" />
                  )}
                  <span className="hidden sm:inline">Download PDF</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 sm:py-10 px-3 sm:px-8 overflow-y-auto print:p-0 print:overflow-visible">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground no-print">
            <Loader2 className="w-10 h-10 animate-spin text-pink-500 mb-3" />
            <p>Loading answer key…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-3xl mx-auto no-print">
            <h1 className="text-xl font-display font-bold text-red-700 mb-2">Answer Key Not Found</h1>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && worksheet && (
          <div className="max-w-4xl mx-auto print:max-w-none">
            <div
              ref={answerKeyRef}
              id="answer-key-content"
              className={`${PAPER_CLASS} [&_.bf-answer-key]:print:break-before-auto [&_.bf-answer-key]:print:page-break-before-auto [&_.brain-flex-worksheet]:max-w-none [&_.brain-flex-worksheet]:p-0 [&_.brain-flex-worksheet]:mx-0`}
              style={{ colorScheme: "light" }}
              data-testid="answer-key-page"
            >
              <div className="flex justify-end mb-2 print:mb-1.5">
                <img
                  src={logoImage}
                  alt="Qik Worksheets"
                  className="h-10 object-contain logo-vibrant"
                  draggable={false}
                  data-answer-key-pdf-logo
                />
              </div>

              <header className="border-b-2 border-black pb-3 mb-4 print:pb-2 print:mb-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h1
                      className={`${titleFont} font-bold font-display leading-tight text-black break-words`}
                      data-testid="answer-key-title"
                    >
                      Answer Key
                    </h1>
                    <p className={`${subtitleFont} font-semibold mt-0.5 text-gray-800`}>
                      {worksheet.worksheetType === "brain_flex"
                        ? `${worksheet.className} — Brain Flex`
                        : `${worksheet.className} — ${worksheet.subject}`}
                    </p>
                    {topicDisplay && (
                      <p className="text-sm font-semibold mt-0.5 text-gray-800">{topicDisplay}</p>
                    )}
                    <p
                      className="text-gray-600 font-sans text-xs font-semibold mt-1 tracking-wide"
                      data-testid="answer-key-ref"
                    >
                      Ref: {worksheet.serialNumber || `#${worksheet.id}`}
                    </p>
                    <p className="text-gray-500 font-sans text-[10px] uppercase tracking-widest mt-0.5">
                      {boardLabel} • {difficultyLabel}
                    </p>
                  </div>
                </div>
              </header>

              <div className={`answer-key-body ${SECTIONS_CLASS} space-y-3`}>
                {worksheet.worksheetType === "brain_flex" ? (
                  <BrainFlexRender worksheet={{ ...worksheet, id: worksheet.id }} showAnswerKeyOnly />
                ) : (
                  <AnswerSheet content={worksheet.content as any} variant="standalone" />
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400 font-sans">
                Generated by Qik Worksheet • qikworksheet.in
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
