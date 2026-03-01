import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, BookOpen, LayoutList, Settings2, UserRound, X, CheckSquare, BookMarked, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useChildren } from "@/hooks/use-children";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { insertWorksheetSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { findNcertBooks } from "@/lib/ncertBooks";
import { getSubjectBooks, type BookInfo } from "@/lib/ncertChapters";

const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple Choice (MCQ)" },
  { id: "fill_blanks", label: "Fill in the Blanks" },
  { id: "true_false", label: "True or False" },
  { id: "one_word", label: "One Word Answers" },
  { id: "short_answer", label: "Short Answers" },
  { id: "long_answer", label: "Long Answers" },
  { id: "match", label: "Match the Following" },
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
  const { data: children } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>("");

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

  const hasChildren = children && children.length > 0;
  const isChildLocked = selectedChildId !== null;
  const isFormLocked = hasChildren && !isChildLocked;

  useEffect(() => {
    if (selectedChildId && children) {
      const child = children.find((c) => c.id === selectedChildId);
      if (child) {
        form.setValue("className", child.className);
        form.setValue("board", child.board);
      }
    }
  }, [selectedChildId, children, form]);

  const handleChildSelect = (value: string) => {
    if (value === "__clear__") {
      setSelectedChildId(null);
      form.setValue("className", "");
      form.setValue("board", "");
      return;
    }
    setSelectedChildId(Number(value));
  };

  const [subject, className, board] = form.watch(["subject", "className", "board"]);

  const ncertBooks = (board === "CBSE" && className && subject) ? findNcertBooks(className, subject) : [];

  const chapterBooks: BookInfo[] = (board === "CBSE" && className && subject) ? getSubjectBooks(className, subject) : [];
  const selectedBookData = chapterBooks.find(b => b.bookName === selectedBook);

  useEffect(() => {
    setSelectedBook("");
    form.setValue("topic", "");
  }, [subject, className, form]);

  const toggleQuestionType = (typeId: string) => {
    setSelectedQuestionTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const activeBook = chapterBooks.length === 1 ? chapterBooks[0]?.bookName : selectedBook;
      const payload = {
        ...data,
        ncertBook: (board === "CBSE" && activeBook) ? activeBook : undefined,
        questionTypes: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
      };
      const res = await apiRequest("POST", "/api/worksheets/generate", payload);
      const result = await res.json();
      toast({
        title: "Success!",
        description: "Your worksheet has been generated successfully.",
      });
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
    }
  };

  const isGenerating = generateMutation.isPending;

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
          
          {hasChildren && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <UserRound className="w-4 h-4 text-primary/70" /> Select Child
              </label>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedChildId !== null ? String(selectedChildId) : ""}
                  onValueChange={handleChildSelect}
                >
                  <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl flex-1" data-testid="select-child">
                    <SelectValue placeholder="Select a child to continue" />
                  </SelectTrigger>
                  <SelectContent>
                    {children!.map((child) => (
                      <SelectItem key={child.id} value={String(child.id)} data-testid={`option-child-${child.id}`}>
                        {child.name} — {child.className}, {child.board}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isChildLocked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleChildSelect("__clear__")}
                    data-testid="button-clear-child"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {isChildLocked && (
                <p className="text-xs text-muted-foreground" data-testid="text-child-locked">
                  Grade and board are set from the selected child's profile.
                </p>
              )}
              {isFormLocked && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" data-testid="text-select-child-prompt">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Please select a child to unlock the worksheet configuration below.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isFormLocked ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            {/* Grade / Class */}
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary/70" /> Grade Level
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isChildLocked}>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isChildLocked}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-board">
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Common Core">Common Core</SelectItem>
                      <SelectItem value="CBSE">CBSE</SelectItem>
                      <SelectItem value="ICSE">ICSE</SelectItem>
                      <SelectItem value="IGCSE">IGCSE</SelectItem>
                      <SelectItem value="State Board">State Board</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Chapter */}
            <FormField
              control={form.control}
              name="chapter"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Chapter
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Chapter 5: Life Processes, Unit 2: Algebra" 
                      className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                      {...field}
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Topic */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Topic
                  </FormLabel>
                  <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="manual">Specific Topic</TabsTrigger>
                      <TabsTrigger value="chapters">Chapters</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual">
                      <FormControl>
                        <Input 
                          placeholder="e.g. Photosynthesis, Trigonometry, World War II" 
                          className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="mt-2">Be as specific as possible for better results.</FormDescription>
                    </TabsContent>
                    <TabsContent value="chapters">
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
                            <p className="text-xs text-muted-foreground">
                              Worksheet will be based on: <span className="font-medium text-foreground">{field.value}</span>
                              {chapterBooks.length > 1 && selectedBook ? ` from ${selectedBook}` : ` from ${chapterBooks[0]?.bookName}`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed rounded-xl text-center text-sm text-muted-foreground bg-muted/30">
                          {board !== "CBSE" ? (
                            <p>Chapter lists are available for CBSE board. Select CBSE as the board to browse chapters.</p>
                          ) : !className || !subject ? (
                            <p>Select a grade and subject to see available NCERT chapters</p>
                          ) : (
                            <p>No chapter list available for {subject} ({className}). Use the "Specific Topic" tab to enter your topic manually.</p>
                          )}
                        </div>
                      )}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Color Mode */}
            <FormField
              control={form.control}
              name="colorMode"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Print Mode
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <label className={`
                      flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                      ${field.value === 'bw' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-primary/30'}
                    `}>
                      <input 
                        type="radio" 
                        className="sr-only" 
                        {...field} 
                        value="bw" 
                        checked={field.value === 'bw'}
                      />
                      <span className="font-semibold text-foreground mb-1">Black & White</span>
                      <span className="text-xs text-muted-foreground text-center">Optimized for standard printers</span>
                    </label>
                    <label className={`
                      flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                      ${field.value === 'color' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-primary/30'}
                    `}>
                      <input 
                        type="radio" 
                        className="sr-only" 
                        {...field} 
                        value="color"
                        checked={field.value === 'color'} 
                      />
                      <span className="font-semibold text-foreground mb-1 text-primary">Color Accent</span>
                      <span className="text-xs text-muted-foreground text-center">For digital or color printing</span>
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className={`pt-4 ${isFormLocked ? 'opacity-40 pointer-events-none' : ''}`}>
            <Button 
              type="submit" 
              disabled={isGenerating || isFormLocked}
              className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Generating Worksheet...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  Generate Smart Worksheet
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
