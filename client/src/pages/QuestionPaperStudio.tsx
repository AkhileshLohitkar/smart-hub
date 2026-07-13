import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Sparkles,
  Loader2,
  Download,
  X,
  ClipboardList,
  Layers,
  BookOpen,
  GraduationCap,
  ScrollText,
  FileStack,
} from "lucide-react";
import { QuestionPaperRender } from "@/components/QuestionPaperRender";
import { queryClient } from "@/lib/queryClient";
import { normalizeTitleCaseField } from "@/lib/titleCase";
import {
  QP_BOARDS,
  QP_GRADES,
  QP_MAX_FILE_BYTES,
  QP_MAX_PDF_PAGES,
  QP_FILE_SIZE_ERROR,
  QP_PDF_PAGES_ERROR,
  analyzePaper,
  generatePaper,
  fileToPaperImages,
  validateQpUploadFile,
  downloadElementAsPdf,
  type PaperImage,
  type PaperAnalysis,
  type GenerateResult,
} from "@/lib/questionPaperApi";

const MAX_PAGES = QP_MAX_PDF_PAGES;

export default function QuestionPaperStudio() {
  const { data: user, isLoading: userLoading } = useUser();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [board, setBoard] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [images, setImages] = useState<PaperImage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [downloading, setDownloading] = useState<"paper" | "answer" | null>(null);

  useEffect(() => {
    if (!userLoading && !user) setLocation("/auth");
  }, [user, userLoading, setLocation]);

  const imagesWithinLimits =
    images.length > 0 &&
    images.length <= MAX_PAGES &&
    images.every((img) => (img.sourceFileSize ?? 0) <= QP_MAX_FILE_BYTES);
  const canAnalyze =
    !!board && !!className && !!subject && imagesWithinLimits;
  const canGenerate = !!analysis;

  const analyzeMutation = useMutation({
    mutationFn: () => {
      const normalizedSubject = normalizeTitleCaseField(subject);
      setSubject(normalizedSubject);
      return analyzePaper({
        board,
        className,
        subject: normalizedSubject,
        images,
      });
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setResult(null);
      if (!topic.trim() && data.chapters.length > 0) {
        setTopic(data.chapters.map((c) => normalizeTitleCaseField(c)).join(", "));
      }
      toast({ title: "Pattern analyzed", description: "Structure locked from your upload. Generate when ready." });
    },
    onError: (err: any) => {
      toast({ title: "Analysis failed", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      const normalizedSubject = normalizeTitleCaseField(subject);
      const normalizedTopic = normalizeTitleCaseField(topic);
      setSubject(normalizedSubject);
      setTopic(normalizedTopic);
      return generatePaper({
        board,
        className,
        subject: normalizedSubject,
        topic: normalizedTopic || undefined,
        analysis: analysis as PaperAnalysis,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/user/worksheets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Question paper ready",
        description: data?.id
          ? "Saved to My Worksheets. Preview it below, then download the PDF."
          : "Preview it below, then download the PDF.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessingFiles(true);
    try {
      for (const file of files) {
        try {
          validateQpUploadFile(file);
          const pages = await fileToPaperImages(file);
          if (pages.length > MAX_PAGES) {
            toast({
              title: "Upload rejected",
              description: QP_PDF_PAGES_ERROR,
              variant: "destructive",
            });
            continue;
          }
          setImages((prev) => {
            const next = [...prev, ...pages];
            if (next.length > MAX_PAGES) {
              toast({
                title: "Page limit reached",
                description: QP_PDF_PAGES_ERROR,
                variant: "destructive",
              });
              return prev;
            }
            return next;
          });
          setAnalysis(null);
          setResult(null);
        } catch (err: any) {
          const message = err?.message || `${file.name} could not be processed.`;
          const isLimitError =
            message === QP_FILE_SIZE_ERROR || message === QP_PDF_PAGES_ERROR;
          toast({
            title: isLimitError ? "Upload rejected" : "Could not read file",
            description: message,
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    await addFiles(files);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    await addFiles(files);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDownload = async (which: "paper" | "answer") => {
    const id = which === "paper" ? "qp-paper-content" : "qp-answer-content";
    const el = document.getElementById(id);
    if (!el) return;
    setDownloading(which);
    try {
      const base = `${board}_${className}_${subject}`.replace(/[^a-z0-9]+/gi, "_");
      await downloadElementAsPdf(el, which === "paper" ? `QuestionPaper_${base}.pdf` : `AnswerKey_${base}.pdf`);
      toast({ title: "Downloaded!", description: "Your PDF has been saved." });
    } catch {
      toast({ title: "Download failed", description: "Could not generate the PDF. Try again.", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[700px] h-[700px] bg-gradient-primary opacity-5 rounded-full blur-3xl pointer-events-none" />

      <AppNav user={user} onLogout={() => logoutMutation.mutate()} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-primary rounded-xl text-white">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-foreground">Question Paper Studio</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-primary text-white">New</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a sample paper for its layout only — we keep the exact structure and write fresh questions on your topic.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: details */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              <h2 className="font-display font-bold text-base">Paper details</h2>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-primary/70" /> Board</Label>
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger className="h-11" data-testid="select-qp-board">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {QP_BOARDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-primary/70" /> Grade / Standard</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger className="h-11" data-testid="select-qp-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {QP_GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-primary/70" /> Subject</Label>
              <Input
                placeholder="e.g. Mathematics, Science, Social Science"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onBlur={() => setSubject(normalizeTitleCaseField(subject))}
                className="h-11"
                data-testid="input-qp-subject"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary/70" /> Topic / Chapter
                <span className="text-[10px] font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                placeholder="e.g. Factorisation, Light – Reflection and Refraction"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onBlur={() => setTopic(normalizeTitleCaseField(topic))}
                className="h-11"
                data-testid="input-qp-topic"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to use topics detected from the sample, or the full subject syllabus.
              </p>
            </div>
          </Card>

          {/* Step 2: upload */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="font-display font-bold text-base">Upload sample paper</h2>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,.pdf,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={handleFileInput}
              data-testid="input-qp-file"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              disabled={isProcessingFiles}
              className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                dragOver ? "border-primary bg-primary/10" : "border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10"
              }`}
              data-testid="button-qp-upload"
            >
              {isProcessingFiles ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary/60 animate-spin" />
                  <span className="text-sm font-semibold text-primary/80">Processing file...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-primary/60" />
                  <span className="text-sm font-semibold text-primary/80">Tap to add or drop files</span>
                  <span className="text-xs text-muted-foreground">PDF, JPG, PNG, scanned paper or mobile photo</span>
                </>
              )}
            </button>

            <div
              className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 space-y-1 text-[11px] text-muted-foreground leading-relaxed"
              data-testid="qp-upload-limits-help"
            >
              <p>
                <span className="font-semibold text-foreground/80">Supported formats:</span> PDF, JPG, JPEG, PNG
              </p>
              <p>
                <span className="font-semibold text-foreground/80">Maximum file size:</span> 1 MB
              </p>
              <p>
                <span className="font-semibold text-foreground/80">Maximum PDF pages:</span> 4 Pages
              </p>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2" data-testid="qp-image-previews">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-qp-remove-${idx}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 text-center">Page {idx + 1}</div>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              onClick={() => {
                if (!canAnalyze) return;
                if (images.length > MAX_PAGES) {
                  toast({ title: "Upload rejected", description: QP_PDF_PAGES_ERROR, variant: "destructive" });
                  return;
                }
                const oversized = images.some((img) => (img.sourceFileSize ?? 0) > QP_MAX_FILE_BYTES);
                if (oversized) {
                  toast({ title: "Upload rejected", description: QP_FILE_SIZE_ERROR, variant: "destructive" });
                  return;
                }
                analyzeMutation.mutate();
              }}
              disabled={!canAnalyze || analyzeMutation.isPending || isProcessingFiles}
              className="w-full bg-gradient-primary text-white font-semibold rounded-xl h-11"
              data-testid="button-qp-analyze"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing paper...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Analyze Paper</>
              )}
            </Button>
            {!canAnalyze && (
              <p className="text-[11px] text-muted-foreground text-center">
                Select board, grade, subject, and add at least one page (max 1 MB, PDF up to 4 pages).
              </p>
            )}
          </Card>
        </div>

        {/* Step 3: analysis summary */}
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="font-display font-bold text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" /> Pattern locked — ready to generate</h2>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">Structure from uploaded paper (unchanged in output)</p>
                <p className="text-[11px] text-muted-foreground">
                  {analysis.sections.length} section(s) · {analysis.totalMarks || "—"} marks ·{" "}
                  {analysis.durationMinutes ? `${analysis.durationMinutes} min` : "—"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Topic for new questions <span className="text-[10px] font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onBlur={() => setTopic(normalizeTitleCaseField(topic))}
                  placeholder="Leave blank to use detected topics or full subject syllabus"
                  className="h-10"
                  data-testid="input-qp-topic-confirm"
                />
                <p className="text-[11px] text-muted-foreground">
                  {topic.trim()
                    ? `New questions will focus on "${topic.trim()}" within ${subject}.`
                    : analysis.chapters.length > 0
                      ? `No topic set — questions will use detected topics: ${analysis.chapters.join(", ")}.`
                      : `No topic set — questions will cover the ${subject} syllabus for ${className}.`}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Board", value: analysis.board },
                  { label: "Grade", value: analysis.className },
                  { label: "Subject", value: analysis.subject },
                  { label: "Difficulty", value: analysis.difficulty },
                  { label: "Total Marks", value: String(analysis.totalMarks || "—") },
                  { label: "Duration", value: analysis.durationMinutes ? `${analysis.durationMinutes} min` : "—" },
                  { label: "Sections", value: String(analysis.sections.length) },
                  { label: "Question Types", value: String(analysis.detectedQuestionTypes.length || "—") },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground truncate" title={item.value}>{item.value}</p>
                  </div>
                ))}
              </div>

              {analysis.chapters.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground/80 mb-1.5">Topics detected in sample (reference only)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.chapters.map((ch, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{ch}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-foreground/80 mb-1.5">Marks pattern &amp; sections</p>
                <div className="space-y-1.5">
                  {analysis.sections.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {s.headerLine || s.name}{" "}
                          <span className="font-normal text-muted-foreground">· {s.questionType}</span>
                        </p>
                        {s.answerRule && s.answerRule !== "all" && (
                          <p className="text-[11px] text-primary truncate">Attempt {s.answerRule}</p>
                        )}
                        {s.description && !s.headerLine && (
                          <p className="text-[11px] text-muted-foreground truncate">{s.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold">
                          {s.questionCount} sub-Q · {s.sectionMarks ?? s.questionCount * s.marksPerQuestion} marks
                        </p>
                        {s.hasInternalChoice && <p className="text-[10px] text-primary">internal choice</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => generateMutation.mutate()}
                disabled={!canGenerate || generateMutation.isPending}
                className="w-full bg-gradient-primary text-white font-semibold rounded-xl h-12"
                data-testid="button-qp-generate"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating new paper... (10–25s)</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Paper (same structure, new questions)</>
                )}
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Step 4: preview + downloads */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-bold text-base flex items-center gap-2"><FileStack className="w-4 h-4 text-primary" /> Preview</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDownload("paper")}
                  disabled={downloading !== null}
                  className="rounded-xl font-semibold border-2"
                  data-testid="button-qp-download-paper"
                >
                  {downloading === "paper" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Download className="w-4 h-4 mr-1.5" />}
                  Question Paper
                </Button>
                {result.answerKey.length > 0 && (
                  <Button
                    type="button"
                    onClick={() => handleDownload("answer")}
                    disabled={downloading !== null}
                    className="bg-gradient-primary text-white rounded-xl font-semibold"
                    data-testid="button-qp-download-answer"
                  >
                    {downloading === "answer" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <FileText className="w-4 h-4 mr-1.5" />}
                    Answer Key
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-muted/30 border border-border p-3 sm:p-6 overflow-x-auto">
              <QuestionPaperRender paper={result.paper} answerKey={result.answerKey} />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
