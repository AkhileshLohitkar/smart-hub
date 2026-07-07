import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, BookOpen, LayoutList, Settings2, CheckSquare, BookMarked, PenLine, FileText, X, Stamp, Upload, Type, Image as ImageIcon, ImagePlus, Camera, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenerateWorksheet } from "@/hooks/use-worksheets";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { insertWorksheetSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { findNcertBooks } from "@/lib/ncertBooks";
import { getSubjectBooks, type BookInfo } from "@/lib/ncertChapters";
import { STATE_BOARDS, getStateBoardBooks, type StateBoardBookInfo } from "@/lib/stateBoardChapters";
import type { ContentUpload } from "@shared/schema";
import { WATERMARK_MIN_SIZE, WATERMARK_MAX_SIZE } from "@shared/schema";

type BoardCategory = "" | "CBSE" | "State Board" | "Other";

const WATERMARK_ACCEPT = ".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml";
const WATERMARK_MAX_BYTES = 4 * 1024 * 1024; // 4MB upload cap for logo

interface PreviewImage {
  base64: string;
  mimeType: string;
  name: string;
  dataUrl: string;
  size: number;
}

// Mirrors the compression used on the My Notes page so OCR receives a reasonably
// sized image. Only the extracted text is stored server-side, never the image.
function compressImage(file: File): Promise<PreviewImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const originalDataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_SIDE = 2048;
        const QUALITY_START = 0.82;
        const TARGET_BYTES = 3.5 * 1024 * 1024;

        let w = img.width;
        let h = img.height;
        if (w > MAX_SIDE || h > MAX_SIDE) {
          const ratio = Math.min(MAX_SIDE / w, MAX_SIDE / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas error"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        let quality = QUALITY_START;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length * 0.75 > TARGET_BYTES && quality > 0.35) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        const base64 = dataUrl.split(",")[1];
        resolve({
          base64,
          mimeType: "image/jpeg",
          name: file.name,
          dataUrl,
          size: Math.round(base64.length * 0.75),
        });
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = originalDataUrl;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple Choice (MCQ)" },
  { id: "fill_blanks", label: "Fill in the Blanks" },
  { id: "true_false", label: "True or False" },
  { id: "one_word", label: "One Word Answers" },
  { id: "short_answer", label: "Short Answers" },
  { id: "long_answer", label: "Long Answers" },
  { id: "match", label: "Match the Following" },
  { id: "application_based", label: "Application Based" },
] as const;

const formSchema = insertWorksheetSchema.extend({
  length: z.coerce.number().min(1).max(30),
  chapter: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.board === "Other") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a board name",
      path: ["board"],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

export function WorksheetForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const generateMutation = useGenerateWorksheet();
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedStateBoard, setSelectedStateBoard] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [topicTab, setTopicTab] = useState<"ncert" | "library" | "topic">("ncert");
  const notesFileInputRef = useRef<HTMLInputElement>(null);
  const [notesImages, setNotesImages] = useState<PreviewImage[]>([]);
  const [notesLabel, setNotesLabel] = useState("");
  const [isCompressingNotes, setIsCompressingNotes] = useState(false);
  const [isUploadingNotes, setIsUploadingNotes] = useState(false);
  const [watermarkMode, setWatermarkMode] = useState<"default" | "custom">("default");
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkLogo, setWatermarkLogo] = useState<string>("");
  const [watermarkLogoName, setWatermarkLogoName] = useState<string>("");
  const [watermarkSize, setWatermarkSize] = useState<number>(WATERMARK_MAX_SIZE);
  const [boardCategory, setBoardCategory] = useState<BoardCategory>("");
  const [otherBoardInput, setOtherBoardInput] = useState("");

  const { data: allUploads } = useQuery<ContentUpload[]>({
    queryKey: ["/api/content"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      className: "",
      board: "",
      subject: "",
      chapter: "",
      topic: "",
      difficulty: "medium",
      length: 10,
      colorMode: "bw",
    },
  });

  const [subject, className, board] = form.watch(["subject", "className", "board"]);

  const toggleNote = (id: number) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const isCbse = boardCategory === "CBSE";
  const isStateBoard = boardCategory === "State Board";
  const isOtherBoardMode = boardCategory === "Other";

  const ncertBooks = (isCbse && className && subject) ? findNcertBooks(className, subject) : [];

  const cbseChapterBooks: BookInfo[] = (isCbse && className && subject) ? getSubjectBooks(className, subject) : [];
  const stateBoardBooks: StateBoardBookInfo[] = (isStateBoard && selectedStateBoard && className && subject)
    ? getStateBoardBooks(selectedStateBoard, className, subject) : [];
  const chapterBooks: BookInfo[] = isCbse ? cbseChapterBooks : stateBoardBooks;
  const selectedBookData = chapterBooks.find(b => b.bookName === selectedBook);

  useEffect(() => {
    setSelectedBook("");
    form.setValue("topic", "");
  }, [subject, className, form]);

  useEffect(() => {
    if (!isStateBoard) {
      setSelectedStateBoard("");
    } else {
      setSelectedStateBoard((prev) => prev || "Maharashtra");
    }
  }, [boardCategory, isStateBoard]);

  const toggleQuestionType = (typeId: string) => {
    setSelectedQuestionTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handleWatermarkLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const okType = /image\/(png|jpe?g|svg\+xml)/.test(file.type) || /\.(png|jpe?g|svg)$/i.test(file.name);
    if (!okType) {
      toast({
        title: "Unsupported file",
        description: "Please upload a PNG, JPG, JPEG, or SVG image.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > WATERMARK_MAX_BYTES) {
      toast({
        title: "File too large",
        description: "Logo must be under 4MB.",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setWatermarkLogo(typeof reader.result === "string" ? reader.result : "");
      setWatermarkLogoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const clearWatermarkLogo = () => {
    setWatermarkLogo("");
    setWatermarkLogoName("");
  };

  // Board value to associate uploaded content with, derived from the worksheet
  // configuration (state board picks include the specific board name).
  const uploadBoard = isStateBoard && selectedStateBoard
    ? `State Board - ${selectedStateBoard}`
    : isOtherBoardMode && otherBoardInput.trim()
      ? otherBoardInput.trim()
      : board;
  const canUploadNotes = !!(board && className && subject);

  const handleNotesFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (notesImages.length + files.length > 20) {
      toast({ title: "Too many images", description: "Maximum 20 images per upload.", variant: "destructive" });
      return;
    }
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: `${f.name} is not an image.`, variant: "destructive" });
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    setIsCompressingNotes(true);
    for (const file of validFiles) {
      try {
        const compressed = await compressImage(file);
        setNotesImages((prev) => [...prev, compressed]);
      } catch {
        toast({ title: "Could not load image", description: `${file.name} could not be processed.`, variant: "destructive" });
      }
    }
    setIsCompressingNotes(false);
  };

  const removeNotesImage = (idx: number) => {
    setNotesImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNotesUpload = async () => {
    if (!canUploadNotes) {
      toast({
        title: "Add worksheet details first",
        description: "Select Grade, Curriculum Board, and Subject above before uploading.",
        variant: "destructive",
      });
      return;
    }
    if (notesImages.length === 0) return;
    setIsUploadingNotes(true);
    try {
      await apiRequest("POST", "/api/content/upload", {
        board: uploadBoard,
        className,
        subject,
        chapter: "",
        topic: notesLabel.trim(),
        sourceDescription: "",
        images: notesImages.map((img) => ({ base64: img.dataUrl, mimeType: img.mimeType })),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Content saved!",
        description: "Text extracted from your photos and saved to your library. Images are not stored — only the text.",
      });
      setNotesImages([]);
      setNotesLabel("");
    } catch (err: any) {
      let msg = "Upload failed. Please try again.";
      try {
        msg = JSON.parse(err.message.split(": ").slice(1).join(": ")).message || msg;
      } catch {
        // ignore
      }
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setIsUploadingNotes(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const activeBook = chapterBooks.length === 1 ? chapterBooks[0]?.bookName : selectedBook;
      const boardToSend = isStateBoard && selectedStateBoard
        ? `State Board - ${selectedStateBoard}`
        : isOtherBoardMode
          ? otherBoardInput.trim()
          : data.board;
      const hasTextbook = activeBook && (isCbse || (isStateBoard && selectedStateBoard));
      const usesNotes = topicTab === "library";
      let topic = (data.topic ?? "").trim();
      if (usesNotes && selectedNoteIds.length > 0 && !topic) {
        const picks = (allUploads || []).filter((u) => selectedNoteIds.includes(u.id));
        for (const u of picks) {
          const label =
            [u.chapter, u.topic].filter(Boolean).join(" · ") ||
            u.sourceDescription?.trim() ||
            u.subject;
          if (label) {
            topic = label;
            break;
          }
        }
        if (!topic) topic = `My notes — ${data.subject}`;
      }
      if (topicTab === "topic") {
        // Manual topic mode: don't auto-derive from notes, and ignore textbook/notes payload fields.
        topic = (data.topic ?? "").trim();
      }
      const payload = {
        ...data,
        topic,
        board: boardToSend,
        ncertBook: (topicTab === "ncert" && hasTextbook) ? activeBook : undefined,
        questionTypes: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
        selectedNoteIds: (usesNotes && selectedNoteIds.length > 0) ? selectedNoteIds : undefined,
        // In topic mode, we intentionally omit chapter/book/notes context.
        chapter: topicTab === "topic" ? undefined : data.chapter,
        watermark:
          watermarkMode === "custom"
            ? {
                mode: "custom",
                text: watermarkText.trim(),
                logo: watermarkLogo,
                size: watermarkSize,
              }
            : undefined,
      };

      if (process.env.NODE_ENV === "development") {
        const payloadSize = JSON.stringify(payload).length;
        console.debug("[WorksheetForm] generate payload", {
          board: boardToSend,
          className: data.className,
          subject: data.subject,
          topic,
          payloadBytes: payloadSize,
        });
      }

      const res = await apiRequest("POST", "/api/worksheets/generate", payload);
      const result = await res.json();

      console.log("Worksheet API response:", result);
      console.log("Worksheet ID:", result?.id);
      if (!result?.id) {
        console.error("Worksheet ID missing", result);
        return;
      }
      toast({
        title: "Success!",
        description: "Your worksheet has been generated successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation(`/worksheet/${result.id}`);
    } catch (error: any) {
      console.error("[WorksheetForm] generation failed:", error);
      let errorMsg = "An unexpected error occurred.";
      const raw = error?.message || "";
      if (raw.startsWith("NETWORK:")) {
        errorMsg = raw.replace(/^NETWORK:\s*/, "");
      } else {
        try {
          const parsed = JSON.parse(raw.split(": ").slice(1).join(": "));
          errorMsg = parsed.message || errorMsg;
        } catch {
          errorMsg = raw || errorMsg;
        }
      }
      toast({
        title: "Generation Failed",
        description: errorMsg,
        variant: "destructive",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGenerating = isSubmitting || generateMutation.isPending;

  return (
    <div className="bg-card rounded-2xl shadow-xl shadow-primary/5 border border-border/50 overflow-hidden">
      <div className="p-6 md:p-8 bg-gradient-to-b from-primary/5 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Settings2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Configure Worksheet
          </h2>
        </div>
        <p className="text-muted-foreground ml-12">
          Define parameters and let our AI craft the perfect educational material.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade / Class */}
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary/70" /> Grade Level
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-grade">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Nursery">Nursery</SelectItem>
                      <SelectItem value="KG 1">KG 1</SelectItem>
                      <SelectItem value="KG 2">KG 2</SelectItem>
                      <SelectItem value="Grade 1">Grade 1</SelectItem>
                      <SelectItem value="Grade 2">Grade 2</SelectItem>
                      <SelectItem value="Grade 3">Grade 3</SelectItem>
                      <SelectItem value="Grade 4">Grade 4</SelectItem>
                      <SelectItem value="Grade 5">Grade 5</SelectItem>
                      <SelectItem value="Grade 6">Grade 6</SelectItem>
                      <SelectItem value="Grade 7">Grade 7</SelectItem>
                      <SelectItem value="Grade 8">Grade 8</SelectItem>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                      <SelectItem value="High School">High School</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Curriculum / Board */}
            <FormField
              control={form.control}
              name="board"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-primary/70" /> Curriculum Board
                  </FormLabel>
                  {isOtherBoardMode ? (
                    <FormControl>
                      <Input
                        placeholder="Enter Board Name"
                        value={otherBoardInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOtherBoardInput(value);
                          field.onChange(value.trim() || "Other");
                        }}
                        className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                        data-testid="input-inline-board-name"
                        autoFocus
                      />
                    </FormControl>
                  ) : (
                    <Select
                      value={boardCategory}
                      onValueChange={(val) => {
                        const category = val as BoardCategory;
                        setBoardCategory(category);
                        setOtherBoardInput("");
                        if (category === "Other") {
                          field.onChange("Other");
                        } else {
                          field.onChange(category);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-board">
                          <SelectValue placeholder="Select Board" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="State Board">State Board</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {isStateBoard && (
              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2 mb-2">
                  <LayoutList className="w-4 h-4 text-primary/70" /> Select State Board
                </label>
                <Select
                  value={selectedStateBoard}
                  onValueChange={(val) => {
                    setSelectedStateBoard(val);
                    setSelectedBook("");
                    form.setValue("topic", "");
                    form.setValue("chapter", "");
                  }}
                >
                  <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-state-board">
                    <SelectValue placeholder="Choose your state board" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATE_BOARDS.map((sb) => (
                      <SelectItem key={sb.value} value={sb.value} data-testid={`option-state-${sb.value}`}>
                        {sb.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Subject
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Mathematics, General Science, English Grammar" 
                      className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {ncertBooks.length > 0 && (
              <div className="col-span-1 md:col-span-2 flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" data-testid="text-ncert-books">
                <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-0.5">NCERT Recommended Textbook{ncertBooks.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{ncertBooks.join(" | ")}</p>
                </div>
              </div>
            )}

            {isStateBoard && selectedStateBoard && stateBoardBooks.length > 0 && (
              <div className="col-span-1 md:col-span-2 flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800" data-testid="text-state-board-books">
                <BookMarked className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">{selectedStateBoard} Board Textbook{stateBoardBooks.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{stateBoardBooks.map(b => b.bookName).join(" | ")}</p>
                </div>
              </div>
            )}

            {/* Topic */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    NCERT Book / Notes / Topic
                  </FormLabel>
                  <Tabs
                    value={topicTab}
                    onValueChange={(v) => {
                      const next = v as "ncert" | "library" | "topic";
                      setTopicTab(next);
                      if (next === "topic") {
                        setSelectedNoteIds([]);
                        form.setValue("chapter", "");
                        setSelectedBook("");
                      }
                    }}
                    className="w-full"
                  >
                  <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1 mb-4">
                      <TabsTrigger value="ncert" className="h-9 w-full px-2 text-xs leading-tight text-center whitespace-normal sm:whitespace-nowrap">
                        NCERT/ State Board Book
                      </TabsTrigger>
                      <TabsTrigger value="library" className="h-9 w-full px-2 text-xs flex items-center justify-center gap-1 whitespace-nowrap">
                        <Library className="w-3 h-3 shrink-0" />
                        Notes
                        {(allUploads?.length ?? 0) > 0 && (
                          <span className="ml-0.5 w-4 h-4 text-[10px] rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">{allUploads?.length}</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="topic" className="h-9 w-full px-2 text-xs whitespace-nowrap">Topic</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ncert">
                      {chapterBooks.length > 0 ? (
                        <div className="space-y-3">
                          {chapterBooks.length === 1 ? (
                            <>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{chapterBooks[0].bookName} ({chapterBooks[0].publisher})</p>
                              </div>
                              <Select
                                value={field.value || ""}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  form.setValue("chapter", val);
                                }}
                              >
                                <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-chapter">
                                  <SelectValue placeholder="Select a chapter" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {chapterBooks[0].chapters.map((ch, idx) => (
                                    <SelectItem key={idx} value={ch} data-testid={`option-chapter-${idx}`}>
                                      {idx + 1}. {ch}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </>
                          ) : (
                            <>
                              <Select
                                value={selectedBook}
                                onValueChange={(val) => {
                                  setSelectedBook(val);
                                  field.onChange("");
                                  form.setValue("chapter", "");
                                }}
                              >
                                <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-book">
                                  <SelectValue placeholder="Select a textbook" />
                                </SelectTrigger>
                                <SelectContent>
                                  {chapterBooks.map((book) => (
                                    <SelectItem key={book.bookName} value={book.bookName} data-testid={`option-book-${book.bookName}`}>
                                      {book.bookName} ({book.publisher})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedBookData && (
                                <Select
                                  value={field.value || ""}
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("chapter", val);
                                  }}
                                >
                                  <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-chapter">
                                    <SelectValue placeholder="Select a chapter" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[300px]">
                                    {selectedBookData.chapters.map((ch, idx) => (
                                      <SelectItem key={idx} value={ch} data-testid={`option-chapter-${idx}`}>
                                        {idx + 1}. {ch}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </>
                          )}
                          {field.value && (
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                Based on: <span className="font-medium text-foreground">{field.value}</span>
                                {chapterBooks.length > 1 && selectedBook ? ` (${selectedBook})` : ` (${chapterBooks[0]?.bookName})`}
                              </p>
                              <button
                                type="button"
                                onClick={() => { field.onChange(""); form.setValue("chapter", ""); setSelectedBook(""); }}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ml-2 shrink-0"
                                data-testid="button-clear-chapter"
                              >
                                <X className="w-3 h-3" /> Clear
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed rounded-xl text-center text-sm text-muted-foreground bg-muted/30">
                          {isCbse && (!className || !subject) ? (
                            <p>Select a grade and subject to see available NCERT chapters</p>
                          ) : isStateBoard && !selectedStateBoard ? (
                            <p>Select a state board above to browse available chapters.</p>
                          ) : isStateBoard && selectedStateBoard && (!className || !subject) ? (
                            <p>Select a grade and subject to see available {selectedStateBoard} board chapters.</p>
                          ) : !isCbse && !isStateBoard ? (
                            <p>Chapter lists are available for CBSE and State Boards. Select one to browse chapters.</p>
                          ) : (
                            <p>No chapter list available for {subject} ({className}). Use the <span className="font-medium text-foreground">Notes</span> tab with your uploaded content, or try another grade/subject.</p>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="library">
                      <div className="space-y-4">
                        {/* Image upload + OCR */}
                        <div className="space-y-3">
                          <input
                            ref={notesFileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleNotesFileChange}
                            data-testid="input-notes-file"
                          />

                          <button
                            type="button"
                            onClick={() => notesFileInputRef.current?.click()}
                            disabled={isCompressingNotes}
                            className="w-full border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-6 flex flex-col items-center gap-2 transition-colors cursor-pointer bg-primary/5 hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
                            data-testid="button-notes-add-images"
                          >
                            {isCompressingNotes ? (
                              <>
                                <Loader2 className="w-8 h-8 text-primary/60 animate-spin" />
                                <span className="text-sm font-semibold text-primary/80">Optimising image...</span>
                                <span className="text-xs text-muted-foreground">Resizing for AI reading</span>
                              </>
                            ) : (
                              <>
                                <ImagePlus className="w-8 h-8 text-primary/60" />
                                <span className="text-sm font-semibold text-primary/80">Tap to add photos</span>
                                <span className="text-xs text-muted-foreground">JPG, PNG, HEIC • Any size — auto-compressed • Up to 20 pages</span>
                              </>
                            )}
                          </button>

                          {notesImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2" data-testid="notes-image-previews">
                              {notesImages.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => removeNotesImage(idx)}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`button-notes-remove-image-${idx}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 flex justify-between items-center">
                                    <span>Page {idx + 1}</span>
                                    <span className="opacity-80">{img.size < 1024 * 1024 ? `${Math.round(img.size / 1024)}KB` : `${(img.size / (1024 * 1024)).toFixed(1)}MB`}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {notesImages.length > 0 && (
                            <Input
                              value={notesLabel}
                              onChange={(e) => setNotesLabel(e.target.value)}
                              placeholder="Chapter / topic label (optional) — e.g. Photosynthesis"
                              className="h-11 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                              data-testid="input-notes-label"
                            />
                          )}

                          {!canUploadNotes && (
                            <p className="text-xs text-muted-foreground">
                              Select <span className="font-medium text-foreground">Grade</span>, <span className="font-medium text-foreground">Curriculum Board</span> and <span className="font-medium text-foreground">Subject</span> above — saved content uses those details automatically.
                            </p>
                          )}

                          <Button
                            type="button"
                            onClick={handleNotesUpload}
                            disabled={isUploadingNotes || notesImages.length === 0 || !canUploadNotes}
                            className="w-full bg-gradient-primary text-white font-semibold rounded-xl h-11"
                            data-testid="button-notes-extract-save"
                          >
                            {isUploadingNotes ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Reading pages... (this may take a moment)
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Extract Text &amp; Save
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Saved Content Library */}
                        <div className="border-t border-border pt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">Saved Content Library</p>
                            {(allUploads?.length ?? 0) > 0 && (
                              <span className="text-[11px] text-muted-foreground">({allUploads?.length} saved)</span>
                            )}
                          </div>
                          {(allUploads?.length ?? 0) > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground mb-1">Select one or more items — the worksheet will be based on that content.</p>
                              {(allUploads || []).map((upload) => {
                                const isSelected = selectedNoteIds.includes(upload.id);
                                const label = [upload.chapter, upload.topic].filter(Boolean).join(" · ") || upload.sourceDescription || `${upload.subject} notes`;
                                const preview = upload.extractedText?.slice(0, 100);
                                return (
                                  <button
                                    key={upload.id}
                                    type="button"
                                    onClick={() => toggleNote(upload.id)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-150 ${
                                      isSelected
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border bg-background hover:border-primary/40"
                                    }`}
                                    data-testid={`toggle-library-${upload.id}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          {(upload.pageCount ?? 0) > 0 ? (
                                            <Camera className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                          ) : (
                                            <PenLine className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                          )}
                                          <span className={`text-xs font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>{label}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{upload.subject}</span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{upload.className}</span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{upload.board}</span>
                                        </div>
                                        {preview && (
                                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-tight">{preview}{(upload.extractedText?.length || 0) > 100 ? "…" : ""}</p>
                                        )}
                                      </div>
                                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                              {selectedNoteIds.length > 0 && (
                                <p className="text-xs text-primary font-medium pt-1">
                                  ✓ {selectedNoteIds.length} item{selectedNoteIds.length > 1 ? "s" : ""} selected — worksheet will use this content
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-5 border-2 border-dashed rounded-xl text-center bg-muted/30 space-y-1">
                              <Library className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
                              <p className="text-sm font-semibold text-muted-foreground">Your library is empty</p>
                              <p className="text-xs text-muted-foreground">Upload photos above to extract and save content here.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="topic">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Enter a topic and we&apos;ll generate questions based on it (no textbook chapters or notes will be used).
                        </p>
                        <Input
                          placeholder="Enter topic (e.g. Photosynthesis, Algebra)"
                          className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          data-testid="input-topic"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-1 md:col-span-2 space-y-3">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary/70" /> Question Types
                <span className="text-xs font-normal text-muted-foreground">(select one or more, or leave empty for auto)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUESTION_TYPES.map((qt) => (
                  <button
                    key={qt.id}
                    type="button"
                    onClick={() => toggleQuestionType(qt.id)}
                    className={`px-3 py-2.5 text-xs font-medium rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedQuestionTypes.includes(qt.id)
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                    data-testid={`toggle-qtype-${qt.id}`}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
              {selectedQuestionTypes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedQuestionTypes.length} type{selectedQuestionTypes.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Difficulty */}
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Difficulty Level
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Beginner / Easy</SelectItem>
                      <SelectItem value="medium">Intermediate / Medium</SelectItem>
                      <SelectItem value="hard">Advanced / Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Length */}
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Number of Questions
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min={1}
                      max={30}
                      className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Watermark Settings */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-primary/70" /> Watermark Settings
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { id: "default", title: "Default Watermark", desc: "Use the Qik Worksheets watermark" },
                  { id: "custom", title: "Custom Watermark", desc: "Use your own logo or text" },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWatermarkMode(opt.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      watermarkMode === opt.id
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:border-primary/30"
                    }`}
                    data-testid={`toggle-watermark-${opt.id}`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        watermarkMode === opt.id ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {watermarkMode === opt.id && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${watermarkMode === opt.id ? "text-primary" : "text-foreground"}`}>
                        {opt.title}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
                    </span>
                  </button>
                ))}
              </div>

              {watermarkMode === "custom" && (
                <div className="space-y-4 p-4 rounded-xl border-2 border-border bg-background/60">
                  {/* Upload Logo */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-primary/70" /> Upload Logo
                    </label>
                    {watermarkLogo ? (
                      <div className="flex items-center gap-3 p-2.5 rounded-lg border-2 border-primary/30 bg-primary/5">
                        <img
                          src={watermarkLogo}
                          alt="Watermark logo preview"
                          className="w-10 h-10 object-contain rounded-md bg-white shrink-0"
                        />
                        <span className="text-xs font-medium text-foreground truncate flex-1 min-w-0">{watermarkLogoName || "Uploaded logo"}</span>
                        <button
                          type="button"
                          onClick={clearWatermarkLogo}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          data-testid="button-clear-watermark-logo"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-border bg-background cursor-pointer text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors" data-testid="input-watermark-logo">
                        <Upload className="w-4 h-4" />
                        <span>Upload PNG, JPG, JPEG, or SVG</span>
                        <input
                          type="file"
                          accept={WATERMARK_ACCEPT}
                          className="hidden"
                          onChange={handleWatermarkLogoChange}
                        />
                      </label>
                    )}
                  </div>

                  {/* Watermark Text */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-primary/70" /> Watermark Text
                    </label>
                    <Input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter your school name, institute name, brand name, etc."
                      maxLength={120}
                      className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                      data-testid="input-watermark-text"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      If a logo is uploaded it will be used. Otherwise this text becomes the watermark.
                    </p>
                  </div>

                  {/* Watermark Size */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground/80">Watermark Size</label>
                      <span className="text-xs font-semibold text-primary tabular-nums">{watermarkSize}%</span>
                    </div>
                    <input
                      type="range"
                      min={WATERMARK_MIN_SIZE}
                      max={WATERMARK_MAX_SIZE}
                      step={5}
                      value={watermarkSize}
                      onChange={(e) => setWatermarkSize(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                      data-testid="input-watermark-size"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isGenerating}
              data-testid="button-generate-worksheet"
              className={`w-full h-14 text-lg rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden
                ${isGenerating
                  ? 'bg-primary/80 cursor-not-allowed shadow-primary/10'
                  : 'shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5'
                }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  <span className="font-semibold">Generating — please wait…</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">Generate Smart Worksheet</span>
                </span>
              )}
            </Button>
            <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
              <strong>Disclaimer:</strong> This worksheet is generated by AI based on your uploaded content. While we strive for accuracy, AI can occasionally produce errors or &quot;hallucinations.&quot; Please review all questions and answers for educational accuracy before distributing them to students.
            </div>
            {isGenerating && (
              <p className="text-center text-sm text-muted-foreground mt-2 animate-pulse" data-testid="text-generating-notice">
                AI is crafting your worksheet — this takes 10–20 seconds
              </p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
