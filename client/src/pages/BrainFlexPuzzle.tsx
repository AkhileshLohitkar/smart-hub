import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Brain, Sparkles, Target, LayoutList, Star, Loader2, ArrowRight } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PUZZLE_TYPES = [
  { id: "sudoku", name: "Sudoku", description: "Number grid logic", icon: "🔢" },
  { id: "word-search", name: "Word Search", description: "Find hidden words", icon: "🔍" },
  { id: "riddles", name: "Riddles", description: "Who Am I puzzles", icon: "🤔" },
  { id: "boggles", name: "Boggles", description: "Unscramble words", icon: "🔀" },
  { id: "brain-teasers", name: "Brain Teasers", description: "Logic & patterns", icon: "🧠" },
  { id: "crossword", name: "Crossword", description: "Clue-based word puzzle", icon: "🧩" },
];

const GRADES = ["Nursery", "KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner", stars: 1, description: "Simple & fun" },
  { value: "intermediate", label: "Intermediate", stars: 2, description: "A bit challenging" },
  { value: "advanced", label: "Advanced", stars: 3, description: "Think hard!" },
];

/** Dark-mode-only surface tokens (light mode unchanged). */
const DARK_CARD =
  "dark:bg-[#101018] dark:border-[#2a2a3d] dark:shadow-lg dark:shadow-purple-500/5";
const DARK_INPUT =
  "dark:bg-[#0c0c14] dark:border-[#2d2d42] dark:text-white dark:placeholder:text-gray-500";

const BOARD_OPTIONS = [
  { value: "CBSE", label: "CBSE" },
  { value: "State Board - Maharashtra", label: "State Board - Maharashtra" },
] as const;

type CurriculumBoard = (typeof BOARD_OPTIONS)[number]["value"];

const BOARD_SELECT_TRIGGER =
  `h-12 w-full rounded-xl border-2 border-input bg-background text-sm text-gray-900 shadow-sm ` +
  `focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 [&>span]:line-clamp-1 [&>span]:text-left ` +
  `[&>span]:text-gray-900 dark:[&>span]:text-white ${DARK_INPUT}`;

const BOARD_SELECT_CONTENT =
  "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border-2 border-border bg-popover p-1 text-popover-foreground shadow-md " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 " +
  "dark:bg-[#101018] dark:border-[#2a2a3d] dark:text-white dark:shadow-lg dark:shadow-purple-500/10 " +
  "[&_[data-radix-select-viewport]]:h-auto [&_[data-radix-select-viewport]]:min-h-0";

const BOARD_SELECT_ITEM =
  "relative cursor-pointer rounded-lg py-2.5 pl-8 pr-3 text-sm outline-none " +
  "text-gray-800 dark:text-gray-300 " +
  "data-[highlighted]:bg-muted/50 data-[highlighted]:text-gray-900 " +
  "dark:data-[highlighted]:bg-[#1a1a28] dark:data-[highlighted]:text-gray-200 " +
  "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500/20 data-[state=checked]:to-purple-600/25 " +
  "data-[state=checked]:font-medium data-[state=checked]:text-primary " +
  "dark:data-[state=checked]:from-pink-500/30 dark:data-[state=checked]:to-purple-600/30 dark:data-[state=checked]:text-primary " +
  "dark:data-[state=checked]:data-[highlighted]:from-pink-500/35 dark:data-[state=checked]:data-[highlighted]:to-purple-600/35 " +
  "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-primary";

/** Light-mode selected puzzle card colors (dark mode unchanged). */
const PUZZLE_LIGHT_SELECTED: Record<string, string> = {
  sudoku: "bg-blue-100 border-blue-400",
  "word-search": "bg-green-100 border-green-400",
  riddles: "bg-yellow-50 border-yellow-300",
  "brain-teasers": "bg-purple-100 border-purple-400",
  boggles: "bg-pink-50 border-pink-300",
  crossword: "bg-violet-50 border-violet-300",
};

/** Puzzle type card typography — Sudoku card is the reference. */
const PUZZLE_CARD_TITLE_CLASS =
  "m-0 text-base font-semibold leading-tight tracking-normal text-left text-gray-900 dark:text-white";
const PUZZLE_CARD_SUBTITLE_CLASS =
  "m-0 text-sm font-normal leading-snug tracking-normal text-left text-gray-700 dark:text-gray-300";

const PUZZLE_DARK_SELECTED: Record<string, string> = {
  sudoku: "dark:border-blue-500/60 dark:bg-blue-500/10 dark:shadow-blue-500/10",
  "word-search": "dark:border-green-500/60 dark:bg-green-500/10 dark:shadow-green-500/10",
  riddles: "dark:border-yellow-500/60 dark:bg-yellow-500/10 dark:shadow-yellow-500/10",
  "brain-teasers": "dark:border-purple-500/60 dark:bg-purple-500/10 dark:shadow-purple-500/10",
  boggles: "dark:border-pink-500/60 dark:bg-pink-500/10 dark:shadow-pink-500/10",
  crossword: "dark:border-violet-500/60 dark:bg-violet-500/10 dark:shadow-violet-500/10",
};

export default function BrainFlexPuzzle() {
  const { data: user, isLoading: userLoading } = useUser();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedBoard, setSelectedBoard] = useState<CurriculumBoard | "">("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [curriculumSubject, setCurriculumSubject] = useState("");
  const [curriculumTopic, setCurriculumTopic] = useState("");
  const [selectedPuzzles, setSelectedPuzzles] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("beginner");

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/auth");
    }
  }, [user, userLoading, setLocation]);

  const selectedPuzzleData = PUZZLE_TYPES.filter((puzzle) => selectedPuzzles.includes(puzzle.id));
  const selectedPuzzleEmojis = selectedPuzzleData.map((puzzle) => puzzle.icon).join(" ");
  const boardToSend = selectedBoard;

  const togglePuzzle = (puzzleId: string) => {
    setSelectedPuzzles((prev) =>
      prev.includes(puzzleId) ? prev.filter((p) => p !== puzzleId) : [...prev, puzzleId],
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGrade || selectedPuzzles.length === 0) {
        throw new Error("Select a grade and at least one puzzle type.");
      }
      const res = await apiRequest("POST", "/api/brain-flex/generate", {
        className: selectedGrade,
        board: boardToSend,
        subject: curriculumSubject.trim() || "Brain Flex",
        chapter: curriculumTopic.trim(),
        puzzleTypeIds: selectedPuzzles,
        difficulty,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      console.log("BrainFlex Response:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/user/worksheets"] });
      if (data?.id) {
        setLocation(`/brain-flex/${data.id}`);
      } else {
        toast({
          title: "Generated, but missing ID",
          description: "Could not open worksheet page. Please check server response.",
          variant: "destructive",
        });
      }
    },
    onError: (err: Error) => {
      let msg = err.message || "Try again.";
      try {
        const part = msg.split(": ").slice(1).join(": ");
        const j = JSON.parse(part);
        if (j.message) msg = j.message;
      } catch {
        /* keep msg */
      }
      toast({ title: "Could not save", description: msg, variant: "destructive" });
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 dark:bg-[#09090f]">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-[#09090f]">
      <AppNav user={user} onLogout={() => logoutMutation.mutate()} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-950/50 dark:border dark:border-purple-500/30 text-purple-600 dark:text-purple-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            New Feature
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3 flex-wrap">
            <Brain className="w-10 h-10 text-primary" />
            Brain-Flex Puzzles
          </h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Where play meets curriculum — AI-generated puzzle sheets with Sudoku, Word Search, Riddles and more. 80% curriculum, 20% fun!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className={`p-6 ${DARK_CARD}`}>
              <div className="flex items-center gap-2 mb-4">
                <LayoutList className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Curriculum Board</h3>
              </div>
              <div className="space-y-3">
                <Select
                  value={selectedBoard || undefined}
                  onValueChange={(v) => setSelectedBoard(v as CurriculumBoard)}
                >
                  <SelectTrigger
                    className={BOARD_SELECT_TRIGGER}
                    data-testid="select-brainflex-board"
                    aria-label="Curriculum board"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    className={BOARD_SELECT_CONTENT}
                  >
                    {BOARD_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className={BOARD_SELECT_ITEM}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <Card className={`p-6 ${DARK_CARD}`}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Age / Grade</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {GRADES.map((grade) => {
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setSelectedGrade(grade)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                        selectedGrade === grade
                          ? "border-pink-400 bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.45)] ring-1 ring-pink-400/70 dark:border-pink-400 dark:from-pink-500 dark:to-purple-600 dark:shadow-[0_0_14px_rgba(236,72,153,0.55)] dark:ring-pink-400/60"
                          : "border-border hover:border-primary/30 text-gray-800 dark:border-[#2a2a3d] dark:bg-[#0c0c14] dark:text-gray-200"
                      }`}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className={`p-6 ${DARK_CARD}`}>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="-ml-0.5 inline-flex h-4 w-5 items-end gap-[3px] translate-y-[1px] drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]" aria-hidden>
                    <span className="w-[2px] h-3.5 rounded-sm bg-gradient-to-b from-pink-500 to-fuchsia-500" />
                    <span className="w-[2px] h-2.5 rounded-sm bg-gradient-to-b from-pink-500 to-fuchsia-500" />
                    <span className="w-[2px] h-4 rounded-sm bg-gradient-to-b from-pink-500 to-fuchsia-500" />
                    <span className="w-[2px] h-3 rounded-sm bg-gradient-to-b from-pink-500 to-fuchsia-500" />
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Curriculum Focus</h3>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-400">Optional</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-800 font-medium dark:text-gray-300 mb-2 block">Subject</label>
                  <Input
                    placeholder="e.g. Science, Maths, English"
                    className={`h-10 placeholder:text-gray-500 ${DARK_INPUT}`}
                    value={curriculumSubject}
                    onChange={(e) => setCurriculumSubject(e.target.value)}
                    data-testid="input-brainflex-subject"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-800 font-medium dark:text-gray-300 mb-2 block">Chapter / Topic</label>
                  <Input
                    placeholder="e.g. Photosynthesis, Fractions"
                    className={`h-10 placeholder:text-gray-500 ${DARK_INPUT}`}
                    value={curriculumTopic}
                    onChange={(e) => setCurriculumTopic(e.target.value)}
                    data-testid="input-brainflex-topic"
                  />
                </div>
              </div>
              <p className=" italic text-xs text-gray-700 dark:text-gray-400 mt-3">
                Leave blank for mixed curriculum puzzles, or fill in to get subject-specific word searches, riddles & brain teasers.
              </p>
            </Card>

            <Card className={`p-6 ${DARK_CARD}`}>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Difficulty</h3>
              </div>
              <div className="space-y-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setDifficulty(diff.value)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      difficulty === diff.value
                        ? "border-primary bg-primary/10 dark:bg-primary/15 dark:border-primary"
                        : "border-border hover:border-primary/30 text-gray-800 dark:border-[#2a2a3d] dark:bg-[#0c0c14] dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{diff.label}</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{diff.description}</p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < diff.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-400 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className={`p-6 ${DARK_CARD}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="text-gray-900 dark:text-white font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 shrink-0 text-pink-500 dark:text-pink-400" />
                  <h3>Puzzle Types</h3>
                </div>
                <div className="flex gap-2">
  <button
    type="button"
    onClick={() => setSelectedPuzzles(PUZZLE_TYPES.map((p) => p.id))}
    className="text-sm font-semibold text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors"
  >
    All
  </button>

  <span className="text-sm text-gray-600 dark:text-gray-500">•</span>

  <button
    type="button"
    onClick={() => setSelectedPuzzles([])}
    className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
  >
    Clear
  </button>
</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PUZZLE_TYPES.map((puzzle) => {
                  const selected = selectedPuzzles.includes(puzzle.id);
                  const iconGradient =
                    puzzle.id === "sudoku"
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                      : puzzle.id === "word-search"
                        ? "bg-gradient-to-br from-green-500 to-emerald-500"
                        : puzzle.id === "riddles"
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                          : puzzle.id === "brain-teasers"
                            ? "bg-gradient-to-br from-purple-600/80 to-indigo-500/80"
                            : puzzle.id === "crossword"
                              ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                              : "bg-gradient-to-br from-pink-500 to-red-500";
                  const iconContainerExtra =
                    puzzle.id === "brain-teasers" ? "shadow-inner" : puzzle.id === "crossword" ? "shadow-inner" : "";
                  return (
                    <button
                      key={puzzle.id}
                      type="button"
                      onClick={() => togglePuzzle(puzzle.id)}
                      className={`p-4 rounded-xl border border-gray-300 dark:border-[#2a2a3d] bg-white dark:bg-[#0f0f18]/80 hover:border-gray-500 dark:hover:border-purple-500/30 transition-all duration-300 hover:shadow-md dark:hover:shadow-purple-500/10 hover:scale-[1.01] flex items-center justify-between text-left text-base ${
                        selected
                          ? `${PUZZLE_LIGHT_SELECTED[puzzle.id] ?? "bg-purple-50 border-purple-300"} ${PUZZLE_DARK_SELECTED[puzzle.id] ?? "dark:border-purple-500/60 dark:bg-purple-500/10"}`
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white ${iconGradient} ${iconContainerExtra}`}
                        >
                          {puzzle.icon}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <p className={PUZZLE_CARD_TITLE_CLASS}>{puzzle.name}</p>
                          <p className={PUZZLE_CARD_SUBTITLE_CLASS}>{puzzle.description}</p>
                        </div>
                      </div>
                      {selected ? (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                          ✓
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {selectedPuzzles.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected:</span>
                  {selectedPuzzleData.map((puzzle) => (
                    <span
                      key={puzzle.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-300 bg-purple-100 text-purple-700 font-semibold text-sm dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-purple-200"
                    >
                      <span className="text-sm leading-none" aria-hidden>
                        {puzzle.icon}
                      </span>
                      {puzzle.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>

            <Card className={`rounded-2xl border border-gray-300 px-6 py-7 dark:border-[#2a2a3d] bg-transparent dark:bg-[#101018] max-w-[900px] w-full ${DARK_CARD}`}>
              <div className="flex items-start gap-4">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-2xl leading-none shadow-[0_0_20px_rgba(236,72,153,0.38)]">
                  🧠
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="text-base font-semibold leading-snug text-gray-900 dark:text-white">
                    Your Puzzle Sheet Preview
                  </h2>
                  <div className="mt-3 space-y-2">
                    <p className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-gray-900 dark:text-white">Grade:</span>{" "}
                      {selectedGrade || "Not selected"}
                    </p>
                    <p className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-gray-900 dark:text-white">Difficulty:</span>{" "}
                      {DIFFICULTIES.find((d) => d.value === difficulty)?.label}
                    </p>
                    <p className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-gray-900 dark:text-white">Puzzles:</span>{" "}
                      {selectedPuzzleEmojis || "None selected"}
                    </p>
                    {(curriculumSubject || curriculumTopic) && (
                      <p className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-gray-900 dark:text-white">Focus:</span>{" "}
                        {[curriculumSubject, curriculumTopic].filter(Boolean).join(" — ") || "—"}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 w-fit max-w-full self-start rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-[11px] leading-snug text-blue-800 dark:border-transparent dark:bg-[#1a2540] dark:text-[#93c5fd]">
                    📘 80% curriculum • 🎮 20% fun — with QR code answer key
                  </div>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={!selectedGrade || selectedPuzzles.length === 0 || saveMutation.isPending}
                    className="mt-4 inline-flex h-[65px] w-fit shrink-0 self-start items-center justify-center gap-3.5 rounded-2xl border border-pink-300/40 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 px-4 text-[18px] font-semibold leading-none text-white shadow-[0_0_30px_rgba(236,72,153,0.55)] transition-all duration-200 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 dark:from-purple-600 dark:via-fuchsia-500 dark:to-pink-500 [&_svg]:size-[18px]"
                    data-testid="button-brainflex-generate"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="shrink-0 animate-spin" />
                    ) : (
                      <Sparkles className="shrink-0" />
                    )}
                    <span className="whitespace-nowrap">Generate Fun Sheet</span>
                    <ArrowRight className="shrink-0" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-purple-200 bg-purple-50 px-6 py-7 shadow-sm backdrop-blur-md dark:border-purple-500/35 dark:bg-gradient-to-r dark:from-[#2b102f] dark:via-[#24112d] dark:to-[#1a0d24] dark:shadow-md dark:shadow-purple-500/8">
              <h3 className="mb-5 text-[15px] font-semibold leading-snug text-gray-900 dark:text-white">
                How Brain-Flex Works
              </h3>
              <div className="grid gap-8 pb-1 md:grid-cols-3 md:gap-6">
                <div className="flex flex-col items-center px-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-[15px] font-bold text-white shadow-[0_0_12px_rgba(236,72,153,0.2)]">
                    1
                  </div>
                  <div className="mt-2.5 text-xl leading-none">🎯</div>
                  <p className="mt-2.5 text-[13px] font-semibold leading-snug text-gray-900 dark:text-white">
                    Pick grade, subject & puzzles
                  </p>
                  <p className="mt-1 max-w-[168px] text-[11px] leading-[1.45] text-gray-600 dark:text-gray-400">
                    Select the age group, subject focus and puzzle types
                  </p>
                </div>
                <div className="flex flex-col items-center px-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-[15px] font-bold text-white shadow-[0_0_12px_rgba(236,72,153,0.2)]">
                    2
                  </div>
                  <div className="mt-2.5 text-xl leading-none">🤖</div>
                  <p className="mt-2.5 text-[13px] font-semibold leading-snug text-gray-900 dark:text-white">
                    AI generates content
                  </p>
                  <p className="mt-1 max-w-[168px] text-[11px] leading-[1.45] text-gray-600 dark:text-gray-400">
                    Curriculum-aligned puzzles created instantly
                  </p>
                </div>
                <div className="flex flex-col items-center px-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-[15px] font-bold text-white shadow-[0_0_12px_rgba(236,72,153,0.2)]">
                    3
                  </div>
                  <div className="mt-2.5 text-xl leading-none">📲</div>
                  <p className="mt-2.5 text-[13px] font-semibold leading-snug text-gray-900 dark:text-white">
                    QR code for answers
                  </p>
                  <p className="mt-1 max-w-[168px] text-[11px] leading-[1.45] text-gray-600 dark:text-gray-400">
                    Scan the QR to reveal the answer key
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
