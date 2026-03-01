import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, BookOpen, LayoutList, Settings2, Plus, X, ClipboardList, LogOut, User, FileText, Users, Home as HomeIcon } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { ThemeToggle } from "@/components/ThemeToggle";
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
import { useLocation, Link } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useChildren } from "@/hooks/use-children";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

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
  const { data: childrenData } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  const children = childrenData || [];
  const selectedChild = children.find(c => c.id.toString() === selectedChildId);
  const isChildLocked = !!selectedChild;

  useEffect(() => {
    if (selectedChild) {
      form.setValue("className", selectedChild.className);
      form.setValue("board", selectedChild.board);
    }
  }, [selectedChild, form]);

  const handleAddTopic = () => {
    const trimmed = topicInput.trim();
    if (trimmed && !form.getValues("topics").includes(trimmed)) {
      const current = form.getValues("topics");
      form.setValue("topics", [...current, trimmed], { shouldValidate: true });
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    const current = form.getValues("topics");
    form.setValue("topics", current.filter(t => t !== topic), { shouldValidate: true });
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const onSubmit = async (data: TestPrepValues) => {
    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/test-prep/generate", data);
      const result = await res.json();
      toast({
        title: "Test Paper Generated",
        description: "Your test paper has been created successfully.",
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

  const topics = form.watch("topics");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-gradient-primary opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-gradient-warm opacity-5 rounded-full blur-3xl pointer-events-none" />

      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src={logoImage} alt="Qik Worksheet" className="w-32 h-32 rounded-lg object-contain drop-shadow-md logo-vibrant" data-testid="logo-image" />
            <span className="text-xl font-display font-bold text-gradient-primary" data-testid="logo-text">Qik Worksheets</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="link-dashboard">
                <HomeIcon className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <Link href="/children">
              <Button variant="ghost" size="sm" data-testid="link-my-children">
                <Users className="w-4 h-4 mr-1" /> My Children
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" size="sm" data-testid="link-my-worksheets">
                <FileText className="w-4 h-4 mr-1" /> My Worksheets
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span data-testid="text-username">{user.name}</span>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-muted-foreground"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </nav>

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
                  {children.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary/70" /> Select Child
                      </label>
                      <Select
                        value={selectedChildId}
                        onValueChange={(val) => {
                          if (val === "__clear__") {
                            setSelectedChildId("");
                            form.setValue("className", "");
                            form.setValue("board", "");
                          } else {
                            setSelectedChildId(val);
                          }
                        }}
                      >
                        <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl" data-testid="select-child">
                          <SelectValue placeholder="Choose a child (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__clear__">No child selected</SelectItem>
                          {children.map(child => (
                            <SelectItem key={child.id} value={child.id.toString()}>
                              {child.name} ({child.className} - {child.board})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="className"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary/70" /> Grade Level
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isChildLocked}
                          >
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

                    <FormField
                      control={form.control}
                      name="board"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                            <LayoutList className="w-4 h-4 text-primary/70" /> Curriculum Board
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isChildLocked}
                          >
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
                                onClick={handleAddTopic}
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
