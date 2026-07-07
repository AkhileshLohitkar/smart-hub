import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, Sparkles, BookOpen, LayoutList, Plus, X,
  ClipboardList, Users, PenLine, Camera, ChevronDown,
  ChevronRight, StickyNote, Library, CheckCircle2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppNav } from "@/components/AppNav";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { STATE_BOARDS, getStateBoardBooks } from "@/lib/stateBoardChapters";
import { getSubjectBooks } from "@/lib/ncertChapters";
import type { ContentUpload } from "@shared/schema";

const testPrepSchema = z.object({
  className: z.string().min(1, "Grade is required"),
  board: z.string().min(1, "Board is required"),
  subject: z.string().min(1, "Subject is required"),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  marksScheme: z.enum(["20", "50", "80"]),
  difficulty: z.string().min(1, "Difficulty is required"),
});

type TestPrepValues = z.infer<typeof testPrepSchema>;

export default function TestPrep() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useUser();
  const logoutMutation = useLogout();
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStateBoard, setSelectedStateBoard] = useState<string>("");

  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showNcertPanel, setShowNcertPanel] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [ncertBook, setNcertBook] = useState<string>("");
  const [ncertSelectedBook, setNcertSelectedBook] = useState<string>("");

  const { data: allUploads } = useQuery<ContentUpload[]>({
    queryKey: ["/api/content"],
    enabled: !!user,
  });

  const form = useForm<TestPrepValues>({
    resolver: zodResolver(testPrepSchema),
    defaultValues: {
      className: "",
      board: "",
      subject: "",
      topics: [],
      marksScheme: "20",
      difficulty: "medium",
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/auth");
    }
  }, [user, userLoading, setLocation]);

  const watchedBoard = form.watch("board");
  const watchedClass = form.watch("className");
  const watchedSubject = form.watch("subject");
  const isStateBoard = watchedBoard === "State Board";
  const isCBSE = watchedBoard === "CBSE";

  useEffect(() => {
    if (!isStateBoard) setSelectedStateBoard("");
  }, [watchedBoard, isStateBoard]);

  const effectiveBoard = isStateBoard && selectedStateBoard
    ? `State Board - ${selectedStateBoard}`
    : watchedBoard;

  const notesForForm = (allUploads || []).filter(u => {
    const boardMatch = u.board.toLowerCase().includes(effectiveBoard.toLowerCase()) ||
      effectiveBoard.toLowerCase().includes(u.board.toLowerCase());
    const classMatch = u.className === watchedClass;
    const subjectMatch = watchedSubject
      ? u.subject.toLowerCase().includes(watchedSubject.toLowerCase()) ||
        watchedSubject.toLowerCase().includes(u.subject.toLowerCase())
      : true;
    return boardMatch && classMatch && subjectMatch;
  });

  const ncertBooksForSubject = (isCBSE && watchedClass && watchedSubject)
    ? getSubjectBooks(watchedClass, watchedSubject)
    : [];

  const stateBoardBooksForSubject = (isStateBoard && selectedStateBoard && watchedClass && watchedSubject)
    ? getStateBoardBooks(selectedStateBoard, watchedClass, watchedSubject)
    : [];

  const ncertOrStateBoardBooks = isCBSE ? ncertBooksForSubject : stateBoardBooksForSubject;

  const chaptersForSelectedBook = ncertOrStateBoardBooks.find(
    b => b.bookName === ncertSelectedBook
  )?.chapters || (ncertOrStateBoardBooks.length === 1 ? ncertOrStateBoardBooks[0].chapters : []);

  const activeBookName = ncertOrStateBoardBooks.length === 1
    ? ncertOrStateBoardBooks[0].bookName
    : ncertSelectedBook
      ? ncertOrStateBoardBooks.find(b => b.bookName === ncertSelectedBook)?.bookName || ""
      : "";

  const topics = form.watch("topics");

  const handleAddTopic = (t?: string) => {
    const trimmed = (t ?? topicInput).trim();
    if (trimmed && !form.getValues("topics").includes(trimmed)) {
      form.setValue("topics", [...form.getValues("topics"), trimmed], { shouldValidate: true });
      if (!t) setTopicInput("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    form.setValue("topics", topics.filter(t => t !== topic), { shouldValidate: true });
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleToggleNote = (upload: ContentUpload) => {
    const label = upload.chapter || upload.topic || upload.subject;
    if (selectedNoteIds.includes(upload.id)) {
      setSelectedNoteIds(prev => prev.filter(id => id !== upload.id));
    } else {
      setSelectedNoteIds(prev => [...prev, upload.id]);
      if (label && !topics.includes(label)) {
        form.setValue("topics", [...form.getValues("topics"), label], { shouldValidate: true });
      }
    }
  };

  const handleAddChapter = (chapter: string) => {
    handleAddTopic(chapter);
    setNcertBook(activeBookName);
    setShowNcertPanel(false);
  };

  const onSubmit = async (data: TestPrepValues) => {
    setIsGenerating(true);
    const boardToSend = isStateBoard && selectedStateBoard
      ? `State Board - ${selectedStateBoard}`
      : data.board;
    try {
      const payload: any = { ...data, board: boardToSend };
      if (selectedNoteIds.length > 0) payload.selectedNoteIds = selectedNoteIds;
      if (ncertBook) payload.ncertBook = ncertBook;

      const res = await apiRequest("POST", "/api/test-prep/generate", payload);
      const result = await res.json();
      toast({
        title: "Test Paper Generated",
        description: "Your test paper has been created successfully.",
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
      setIsGenerating(false);
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
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-gradient-primary opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-gradient-warm opacity-5 rounded-full blur-3xl pointer-events-none" />

      <AppNav user={user} onLogout={() => logoutMutation.mutate()} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl shadow-primary/5 border border-border/50 overflow-hidden">
            <div className="p-6 md:p-8 bg-gradient-to-b from-primary/5 to-transparent border-b border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Test Paper Generator
                </h2>
              </div>
              <p className="text-muted-foreground ml-12">
                Create structured test papers with marks distribution across multiple topics.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      <Select value={selectedStateBoard} onValueChange={setSelectedStateBoard}>
                        <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-state-board">
                          <SelectValue placeholder="Choose your state board" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATE_BOARDS.map((sb) => (
                            <SelectItem key={sb.value} value={sb.value}>
                              {sb.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                            placeholder="e.g. Mathematics, Science, English"
                            className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                            {...field}
                            data-testid="input-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="topics"
                    render={() => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel className="text-sm font-semibold text-foreground/80">
                          Topics
                        </FormLabel>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type a topic and press Enter or click Add"
                              className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4 flex-1"
                              value={topicInput}
                              onChange={(e) => setTopicInput(e.target.value)}
                              onKeyDown={handleTopicKeyDown}
                              data-testid="input-topic"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleAddTopic()}
                              disabled={!topicInput.trim()}
                              data-testid="button-add-topic"
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>

                          {topics.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {topics.map((topic, idx) => (
                                <Badge key={idx} variant="secondary" className="gap-1 text-sm py-1 px-3">
                                  {topic}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTopic(topic)}
                                    className="ml-1"
                                    data-testid={`button-remove-topic-${idx}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 pt-1 flex-wrap">
                            {notesForForm.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8 rounded-lg border-dashed"
                                onClick={() => { setShowNotesPanel(!showNotesPanel); setShowNcertPanel(false); }}
                                data-testid="button-toggle-notes"
                              >
                                <StickyNote className="w-3.5 h-3.5 text-primary" />
                                My Notes
                                {selectedNoteIds.length > 0 && (
                                  <Badge variant="default" className="ml-1 text-[10px] h-4 px-1">{selectedNoteIds.length}</Badge>
                                )}
                                {showNotesPanel ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </Button>
                            )}

                            {ncertOrStateBoardBooks.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8 rounded-lg border-dashed"
                                onClick={() => { setShowNcertPanel(!showNcertPanel); setShowNotesPanel(false); }}
                                data-testid="button-toggle-ncert"
                              >
                                <Library className="w-3.5 h-3.5 text-primary" />
                                {isCBSE ? "NCERT Books" : "Textbook Chapters"}
                                {ncertBook && <Badge variant="default" className="ml-1 text-[10px] h-4 px-1">✓</Badge>}
                                {showNcertPanel ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </Button>
                            )}
                          </div>

                          {showNotesPanel && notesForForm.length > 0 && (
                            <div className="border border-border rounded-xl overflow-hidden bg-muted/20">
                              <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <StickyNote className="w-3.5 h-3.5 text-primary" />
                                  Select notes to boost accuracy
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowNotesPanel(false)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="p-2 space-y-1.5 max-h-52 overflow-y-auto">
                                {notesForForm.map(upload => {
                                  const isSelected = selectedNoteIds.includes(upload.id);
                                  const label = upload.chapter || upload.topic || upload.subject;
                                  return (
                                    <button
                                      type="button"
                                      key={upload.id}
                                      onClick={() => handleToggleNote(upload)}
                                      className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "bg-background hover:bg-muted/50 border border-transparent"}`}
                                      data-testid={`note-card-${upload.id}`}
                                    >
                                      <div className={`mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                                        {isSelected
                                          ? <CheckCircle2 className="w-4 h-4" />
                                          : upload.pageCount === 0
                                            ? <PenLine className="w-4 h-4" />
                                            : <Camera className="w-4 h-4" />
                                        }
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">{label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                          {upload.pageCount === 0 ? "Typed notes" : `${upload.pageCount} page${upload.pageCount !== 1 ? "s" : ""}`}
                                          {upload.board && ` · ${upload.board}`}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="px-3 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
                                Selected notes will be used as the primary source for test questions
                              </div>
                            </div>
                          )}

                          {showNcertPanel && ncertOrStateBoardBooks.length > 0 && (
                            <div className="border border-border rounded-xl overflow-hidden bg-muted/20">
                              <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <Library className="w-3.5 h-3.5 text-primary" />
                                  {isCBSE ? "Select NCERT chapter" : "Select textbook chapter"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowNcertPanel(false)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                                {ncertOrStateBoardBooks.length > 1 && (
                                  <div>
                                    <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Select Book</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {ncertOrStateBoardBooks.map(book => (
                                        <button
                                          type="button"
                                          key={book.bookName}
                                          onClick={() => setNcertSelectedBook(book.bookName)}
                                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${ncertSelectedBook === book.bookName ? "bg-primary text-white border-primary" : "bg-background border-border hover:bg-muted/50"}`}
                                        >
                                          {book.bookName}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {chaptersForSelectedBook.length > 0 && (
                                  <div>
                                    {ncertOrStateBoardBooks.length > 1 && ncertSelectedBook && (
                                      <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Chapters</p>
                                    )}
                                    <div className="flex flex-col gap-1">
                                      {chaptersForSelectedBook.map((ch, i) => (
                                        <button
                                          type="button"
                                          key={i}
                                          onClick={() => handleAddChapter(ch)}
                                          className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${topics.includes(ch) ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border hover:bg-muted/50"}`}
                                          data-testid={`chapter-option-${i}`}
                                        >
                                          {topics.includes(ch) && <CheckCircle2 className="w-3 h-3 inline mr-1.5" />}
                                          {ch}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {ncertOrStateBoardBooks.length > 1 && !ncertSelectedBook && (
                                  <p className="text-xs text-muted-foreground text-center py-2">Select a book above to see chapters</p>
                                )}
                              </div>
                              <div className="px-3 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
                                Click a chapter to add it as a topic. Multiple chapters can be added.
                              </div>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marksScheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground/80">
                          Marks Scheme
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-marks">
                              <SelectValue placeholder="Select Marks" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="20">20 Marks</SelectItem>
                            <SelectItem value="50">50 Marks</SelectItem>
                            <SelectItem value="80">80 Marks</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-difficulty">
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
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
                    data-testid="button-generate-test"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Generating Test Paper...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-3" />
                        Generate Test Paper
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}
