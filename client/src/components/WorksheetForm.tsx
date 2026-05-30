import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, BookOpen, LayoutList, Settings2, CheckSquare, BookMarked, PenLine, FileText, X } from "lucide-react";
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
  const [topicTab, setTopicTab] = useState<"ncert" | "notes" | "topic">("ncert");

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

  const matchingUploads = (allUploads || []).filter((u) => {
    const sameGrade = className && u.className.toLowerCase().includes(className.toLowerCase());
    const sameSubject = subject && u.subject.toLowerCase().includes(subject.toLowerCase());
    return sameGrade && sameSubject;
  });

  const toggleNote = (id: number) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const isStateBoard = board === "State Board";

  const ncertBooks = (board === "CBSE" && className && subject) ? findNcertBooks(className, subject) : [];

  const cbseChapterBooks: BookInfo[] = (board === "CBSE" && className && subject) ? getSubjectBooks(className, subject) : [];
  const stateBoardBooks: StateBoardBookInfo[] = (isStateBoard && selectedStateBoard && className && subject)
    ? getStateBoardBooks(selectedStateBoard, className, subject) : [];
  const chapterBooks: BookInfo[] = board === "CBSE" ? cbseChapterBooks : stateBoardBooks;
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
  }, [board, isStateBoard]);

  const toggleQuestionType = (typeId: string) => {
    setSelectedQuestionTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const onSubmit = async (data: FormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const activeBook = chapterBooks.length === 1 ? chapterBooks[0]?.bookName : selectedBook;
      const boardToSend = isStateBoard && selectedStateBoard ? `State Board - ${selectedStateBoard}` : data.board;
      const hasTextbook = activeBook && (board === "CBSE" || (isStateBoard && selectedStateBoard));
      let topic = (data.topic ?? "").trim();
      if (topicTab === "notes" && selectedNoteIds.length > 0 && !topic) {
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
        selectedNoteIds: (topicTab === "notes" && selectedNoteIds.length > 0) ? selectedNoteIds : undefined,
        // In topic mode, we intentionally omit chapter/book/notes context.
        chapter: topicTab === "topic" ? undefined : data.chapter,
      };
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
      let errorMsg = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(error.message.split(": ").slice(1).join(": "));
        errorMsg = parsed.message || errorMsg;
      } catch {
        errorMsg = error.message || errorMsg;
      }
      toast({
        title: "Generation Failed",
        description: errorMsg,
        variant: "destructive",
      });
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-board">
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CBSE">CBSE</SelectItem>
                      <SelectItem value="State Board">State Board</SelectItem>
                    </SelectContent>
                  </Select>
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
                    NCERT Book / My Notes / Topic
                  </FormLabel>
                  <Tabs
                    value={topicTab}
                    onValueChange={(v) => {
                      const next = v as "ncert" | "notes" | "topic";
                      setTopicTab(next);
                      if (next === "topic") {
                        setSelectedNoteIds([]);
                        form.setValue("chapter", "");
                        setSelectedBook("");
                      }
                    }}
                    className="w-full"
                  >
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="ncert">NCERT/ State Board Book</TabsTrigger>
                      <TabsTrigger value="notes" className="flex items-center gap-1">
                        <PenLine className="w-3 h-3" />
                        My Notes
                        {matchingUploads.length > 0 && (
                          <span className="ml-1 w-4 h-4 text-[10px] rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{matchingUploads.length}</span>
                        )}
                      </TabsTrigger>
                    <TabsTrigger value="topic">Topic</TabsTrigger>
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
                          {board === "CBSE" && (!className || !subject) ? (
                            <p>Select a grade and subject to see available NCERT chapters</p>
                          ) : isStateBoard && !selectedStateBoard ? (
                            <p>Select a state board above to browse available chapters.</p>
                          ) : isStateBoard && selectedStateBoard && (!className || !subject) ? (
                            <p>Select a grade and subject to see available {selectedStateBoard} board chapters.</p>
                          ) : board !== "CBSE" && !isStateBoard ? (
                            <p>Chapter lists are available for CBSE and State Boards. Select one to browse chapters.</p>
                          ) : (
                            <p>No chapter list available for {subject} ({className}). Use the <span className="font-medium text-foreground">My Notes</span> tab with your uploaded content, or try another grade/subject.</p>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="notes">
                      {matchingUploads.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground mb-3">Select one or more saved notes — the worksheet will be based on your content.</p>
                          {matchingUploads.map((upload) => {
                            const isSelected = selectedNoteIds.includes(upload.id);
                            const label = [upload.chapter, upload.topic].filter(Boolean).join(" · ") || upload.sourceDescription || "General notes";
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
                                data-testid={`toggle-note-${upload.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                      <span className={`text-xs font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>{label}</span>
                                    </div>
                                    {preview && (
                                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">{preview}{(upload.extractedText?.length || 0) > 100 ? "…" : ""}</p>
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
                              ✓ {selectedNoteIds.length} note{selectedNoteIds.length > 1 ? "s" : ""} selected — worksheet will use your textbook content
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-5 border-2 border-dashed rounded-xl text-center bg-muted/30 space-y-2">
                          <PenLine className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
                          <p className="text-sm font-semibold text-muted-foreground">No saved notes for this subject yet</p>
                          {className && subject ? (
                            <p className="text-xs text-muted-foreground">
                              Go to <span className="text-primary font-medium">My Notes</span> to upload photos of your {subject} textbook pages or type your notes — then they'll appear here.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Select a grade and subject first to see your saved notes.</p>
                          )}
                        </div>
                      )}
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
