import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Star, FileText, Calendar, ClipboardList,
  ChevronDown, ChevronRight, Brain, ScrollText,
} from "lucide-react";
import type { Worksheet } from "@shared/schema";
import { AppNav } from "@/components/AppNav";

type ActiveTab = "worksheet" | "test_prep" | "brain_flex" | "question_paper";

const GRADE_SORT_ORDER = [
  "Nursery", "KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "High School",
];

function gradeSortKey(grade: string) {
  const i = GRADE_SORT_ORDER.indexOf(grade);
  return i === -1 ? 999 : i;
}

function formatDifficultyLabel(raw: string) {
  const d = raw?.toLowerCase() || "";
  if (d === "easy" || d === "beginner") return "Beginner";
  if (d === "medium" || d === "intermediate") return "Intermediate";
  if (d === "hard" || d === "advanced") return "Advanced";
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : "";
}

function BrainFlexGradeGroup({ grade, items }: { grade: string; items: Worksheet[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4 border border-border rounded-xl overflow-hidden bg-card/40" data-testid={`brainflex-grade-${grade.replace(/\s+/g, "-")}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <span className="font-sans font-medium text-xs text-foreground">{grade}</span>
        <Badge variant="outline" className="ml-auto !text-[10px] !font-normal !px-1.5 !py-0">
          {items.length}
        </Badge>
      </button>
      {open && (
        <div className="p-3 space-y-2 border-t border-border/60 bg-background/50">
          {items.map((ws) => (
            <Link key={ws.id} href={`/brain-flex/${ws.id}`}>
              <div
                className="rounded-lg border border-border px-4 py-3 hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-pointer"
                data-testid={`brainflex-row-${ws.id}`}
              >
                <p className="font-sans font-medium text-sm text-foreground leading-snug" data-testid={`brainflex-title-${ws.id}`}>
                  {ws.topic}
                </p>
                <p className="font-sans text-xs text-muted-foreground mt-1" data-testid={`brainflex-meta-${ws.id}`}>
                  {ws.className} · {formatDifficultyLabel(ws.difficulty)}
                  {ws.serialNumber ? ` · ${ws.serialNumber}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function WorksheetCard({ ws }: { ws: Worksheet }) {
  return (
    <Link href={`/worksheet/${ws.id}`}>
      <Card
        className="p-4 hover-elevate cursor-pointer transition-colors"
        data-testid={`card-worksheet-${ws.id}`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="font-sans font-medium text-foreground text-sm leading-snug line-clamp-2" data-testid={`text-topic-${ws.id}`}>
            {ws.topic}
          </p>
          {ws.rating && (
            <div className="flex items-center gap-0.5 shrink-0" data-testid={`text-rating-${ws.id}`}>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">{ws.rating}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {ws.worksheetType === "question_paper" && (
            <Badge className="!text-[10px] !px-1.5 !py-0 !font-normal bg-primary/15 text-primary border-primary/20" data-testid={`badge-type-${ws.id}`}>
              Question Paper Studio
            </Badge>
          )}
          <Badge variant="secondary" className="!text-[10px] !px-1.5 !py-0 !font-normal" data-testid={`badge-subject-${ws.id}`}>
            {ws.subject}
          </Badge>
          <Badge variant="outline" className="!text-[10px] !px-1.5 !py-0 !font-normal" data-testid={`badge-board-${ws.id}`}>
            {ws.board}
          </Badge>
          <Badge variant="outline" className="!text-[10px] !px-1.5 !py-0 !font-normal" data-testid={`badge-grade-${ws.id}`}>
            {ws.className}
          </Badge>
          <Badge variant="outline" className="!text-[10px] !px-1.5 !py-0 !font-normal capitalize" data-testid={`badge-difficulty-${ws.id}`}>
            {ws.difficulty}
          </Badge>
        </div>

        {ws.serialNumber && (
          <p className="text-[10px] font-mono text-muted-foreground mb-2 tracking-wide" data-testid={`text-serial-${ws.id}`}>
            {ws.serialNumber}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span data-testid={`text-date-${ws.id}`}>
            {ws.createdAt
              ? new Date(ws.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Unknown date"}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function SubjectGroup({ subject, items, nested }: { subject: string; items: Worksheet[]; nested?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={nested ? "mb-2" : "mb-4"}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors mb-2"
        data-testid={`subject-group-${subject.replace(/\s+/g, "-").toLowerCase()}`}
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        }
        <span className="font-sans font-medium text-xs text-foreground">{subject}</span>
        <Badge variant="secondary" className="ml-auto !text-[10px] !px-1.5 !py-0 !font-normal">{items.length}</Badge>
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
          {items.map((ws) => (
            <WorksheetCard key={ws.id} ws={ws} />
          ))}
        </div>
      )}
    </div>
  );
}

function groupByGradeThenSubject(items: Worksheet[]) {
  const byGrade: Record<string, Record<string, Worksheet[]>> = {};
  for (const ws of items) {
    const grade = ws.className || "Other";
    const subject = ws.subject || "Other";
    if (!byGrade[grade]) byGrade[grade] = {};
    if (!byGrade[grade][subject]) byGrade[grade][subject] = [];
    byGrade[grade][subject].push(ws);
  }
  return byGrade;
}

function GradeGroup({ grade, bySubject }: { grade: string; bySubject: Record<string, Worksheet[]> }) {
  const [open, setOpen] = useState(true);
  const totalCount = Object.values(bySubject).reduce((sum, arr) => sum + arr.length, 0);
  const subjects = Object.keys(bySubject).sort();

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors mb-2"
        data-testid={`grade-group-${grade.replace(/\s+/g, "-").toLowerCase()}`}
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        }
        <span className="font-sans font-medium text-xs text-foreground">{grade}</span>
        <Badge variant="secondary" className="ml-auto !text-[10px] !px-1.5 !py-0 !font-normal">{totalCount}</Badge>
      </button>
      {open && (
        <div className="pl-2">
          {subjects.map((subj) => (
            <SubjectGroup
              key={subj}
              subject={subj}
              items={bySubject[subj]}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const { data: user, isLoading: userLoading } = useUser();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [activeTab, setActiveTab] = useState<ActiveTab>("worksheet");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tab = params.get("tab");
    if (tab === "brain-flex" || tab === "brain_flex") {
      setActiveTab("brain_flex");
    }
  }, [search]);

  const { data: worksheets, isLoading: worksheetsLoading } = useQuery<Worksheet[]>({
    queryKey: ["/api/user/worksheets"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/auth");
    }
  }, [user, userLoading, setLocation]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const sorted = worksheets
    ? [...worksheets].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db2 - da;
      })
    : [];

  const filteredItems = sorted.filter((ws) => (ws.worksheetType || "worksheet") === activeTab);
  const worksheetCount = sorted.filter((ws) => (ws.worksheetType || "worksheet") === "worksheet").length;
  const testPrepCount = sorted.filter((ws) => (ws.worksheetType || "worksheet") === "test_prep").length;
  const brainFlexCount = sorted.filter((ws) => (ws.worksheetType || "worksheet") === "brain_flex").length;
  const questionPaperCount = sorted.filter((ws) => (ws.worksheetType || "worksheet") === "question_paper").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav user={user} onLogout={() => logoutMutation.mutate()} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="worksheets-history-page">
            <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-page-title">
              My Worksheets
            </h1>
            <p className="font-sans text-sm text-muted-foreground mt-0.5">
              {sorted.length > 0
                ? `${sorted.length} item${sorted.length !== 1 ? "s" : ""} generated`
                : "No worksheets yet"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/new-worksheet">
              <Button className="bg-gradient-primary text-white" data-testid="button-generate-worksheet">
                <Plus className="w-4 h-4 mr-1" /> New Worksheet
              </Button>
            </Link>
            <Link href="/test-prep">
              <Button variant="outline" data-testid="button-generate-test">
                <ClipboardList className="w-4 h-4 mr-1" /> New Test
              </Button>
            </Link>
            <Link href="/brain-flex">
              <Button variant="outline" data-testid="button-brain-flex">
                <Brain className="w-4 h-4 mr-1" /> Brain Flex
              </Button>
            </Link>
            <Link href="/question-paper-studio">
              <Button variant="outline" data-testid="button-question-paper">
                <ScrollText className="w-4 h-4 mr-1" /> Question Paper
              </Button>
            </Link>
          </div>
        </div>

        <div className="worksheets-history-page font-sans text-sm">
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("worksheet")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "worksheet" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-worksheets"
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            Worksheets ({worksheetCount})
          </button>
          <button
            onClick={() => setActiveTab("test_prep")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "test_prep" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-test-papers"
          >
            <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" />
            Test Papers ({testPrepCount})
          </button>
          <button
            onClick={() => setActiveTab("brain_flex")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "brain_flex" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-brain-flex"
          >
            <Brain className="w-3.5 h-3.5 inline mr-1.5" />
            Brain-Flex ({brainFlexCount})
          </button>
          <button
            onClick={() => setActiveTab("question_paper")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "question_paper" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-question-papers"
          >
            <ScrollText className="w-3.5 h-3.5 inline mr-1.5" />
            Question Papers ({questionPaperCount})
          </button>
        </div>

        {worksheetsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-state">
            {activeTab === "worksheet" ? (
              <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
            ) : activeTab === "test_prep" ? (
              <ClipboardList className="w-16 h-16 text-muted-foreground/30 mb-4" />
            ) : activeTab === "question_paper" ? (
              <ScrollText className="w-16 h-16 text-muted-foreground/30 mb-4" />
            ) : (
              <Brain className="w-16 h-16 text-muted-foreground/30 mb-4" />
            )}
            <h2 className="font-sans text-base font-medium text-foreground mb-2">
              {activeTab === "worksheet"
                ? "No worksheets yet"
                : activeTab === "test_prep"
                  ? "No test papers yet"
                  : activeTab === "question_paper"
                    ? "No question papers yet"
                    : "No Brain-Flex puzzles yet"}
            </h2>
            <p className="font-sans text-sm text-muted-foreground mb-6 max-w-sm">
              {activeTab === "worksheet"
                ? "Generate your first worksheet to see it here."
                : activeTab === "test_prep"
                  ? "Create your first test paper to see it here."
                  : activeTab === "question_paper"
                    ? "Generate a paper from Question Paper Studio — it will appear here."
                    : "Generate a puzzle sheet from Brain Flex — it will appear here grouped by grade."}
            </p>
            <Link
              href={
                activeTab === "worksheet"
                  ? "/new-worksheet"
                  : activeTab === "test_prep"
                    ? "/test-prep"
                    : activeTab === "question_paper"
                      ? "/question-paper-studio"
                      : "/brain-flex"
              }
            >
              <Button className="bg-gradient-primary text-white" data-testid="button-generate-first">
                <Plus className="w-4 h-4 mr-1" />
                {activeTab === "worksheet"
                  ? "Generate Worksheet"
                  : activeTab === "test_prep"
                    ? "Create Test Paper"
                    : activeTab === "question_paper"
                      ? "Question Paper Studio"
                      : "Brain Flex"}
              </Button>
            </Link>
          </div>
        ) : activeTab === "brain_flex" ? (
          <div className="max-w-3xl" data-testid="brain-flex-list">
            {(() => {
              const byGrade: Record<string, Worksheet[]> = {};
              for (const ws of filteredItems) {
                const g = ws.className || "Other";
                if (!byGrade[g]) byGrade[g] = [];
                byGrade[g].push(ws);
              }
              const grades = Object.keys(byGrade).sort((a, b) => gradeSortKey(a) - gradeSortKey(b));
              return grades.map((g) => {
                const items = [...byGrade[g]].sort((a, b) => {
                  const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return tb - ta;
                });
                return <BrainFlexGradeGroup key={g} grade={g} items={items} />;
              });
            })()}
          </div>
        ) : (
          <div data-testid="grade-subject-view">
            {(() => {
              const byGrade = groupByGradeThenSubject(filteredItems);
              const grades = Object.keys(byGrade).sort((a, b) => gradeSortKey(a) - gradeSortKey(b));
              return grades.map((grade) => (
                <GradeGroup key={grade} grade={grade} bySubject={byGrade[grade]} />
              ));
            })()}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
