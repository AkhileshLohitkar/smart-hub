import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useChildren } from "@/hooks/use-children";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Star, FileText, Calendar, ClipboardList,
  FolderOpen, Folder, ChevronDown, ChevronRight, User
} from "lucide-react";
import type { Worksheet } from "@shared/schema";
import type { Child } from "@shared/schema";
import { AppNav } from "@/components/AppNav";

type ActiveTab = "worksheet" | "test_prep";

function WorksheetCard({ ws }: { ws: Worksheet }) {
  return (
    <Link href={`/worksheet/${ws.id}`}>
      <Card
        className="p-4 hover-elevate cursor-pointer transition-colors"
        data-testid={`card-worksheet-${ws.id}`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2" data-testid={`text-topic-${ws.id}`}>
            {ws.topic}
          </h3>
          {ws.rating && (
            <div className="flex items-center gap-0.5 shrink-0" data-testid={`text-rating-${ws.id}`}>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">{ws.rating}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <Badge variant="secondary" className="text-xs" data-testid={`badge-subject-${ws.id}`}>
            {ws.subject}
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid={`badge-board-${ws.id}`}>
            {ws.board}
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid={`badge-grade-${ws.id}`}>
            {ws.className}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize" data-testid={`badge-difficulty-${ws.id}`}>
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

function SubjectGroup({ subject, items }: { subject: string; items: Worksheet[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors mb-2"
        data-testid={`subject-group-${subject.replace(/\s+/g, "-").toLowerCase()}`}
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        }
        <span className="font-medium text-sm text-foreground">{subject}</span>
        <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
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

function ChildFolder({
  label,
  items,
  isOther,
  avatarColor,
}: {
  label: string;
  items: Worksheet[];
  isOther?: boolean;
  avatarColor?: string;
}) {
  const [open, setOpen] = useState(true);

  const bySubject: Record<string, Worksheet[]> = {};
  for (const ws of items) {
    const subj = ws.subject || "Other";
    if (!bySubject[subj]) bySubject[subj] = [];
    bySubject[subj].push(ws);
  }
  const subjects = Object.keys(bySubject).sort();

  return (
    <div className="mb-6 border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 w-full px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
        data-testid={`folder-${label.replace(/\s+/g, "-").toLowerCase()}`}
      >
        {open
          ? <FolderOpen className="w-5 h-5 text-primary shrink-0" />
          : <Folder className="w-5 h-5 text-muted-foreground shrink-0" />
        }
        {!isOther && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: avatarColor || "linear-gradient(135deg,#a855f7,#ec4899)" }}
          >
            {label.charAt(0).toUpperCase()}
          </div>
        )}
        {isOther && <User className="w-5 h-5 text-muted-foreground shrink-0" />}
        <span className="font-semibold text-foreground text-sm">{label}</span>
        <Badge variant="outline" className="ml-auto text-xs">{items.length} item{items.length !== 1 ? "s" : ""}</Badge>
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        }
      </button>
      {open && (
        <div className="p-4 bg-background/60">
          {subjects.map((subj) => (
            <SubjectGroup key={subj} subject={subj} items={bySubject[subj]} />
          ))}
        </div>
      )}
    </div>
  );
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#a855f7,#ec4899)",
  "linear-gradient(135deg,#3b82f6,#06b6d4)",
  "linear-gradient(135deg,#f97316,#f59e0b)",
  "linear-gradient(135deg,#22c55e,#10b981)",
  "linear-gradient(135deg,#e879f9,#8b5cf6)",
];

function matchChildToWorksheet(ws: Worksheet, children: Child[]): Child | null {
  if (!children.length) return null;
  return (
    children.find(
      (c) =>
        c.className === ws.className &&
        c.board === ws.board
    ) ?? null
  );
}

export default function History() {
  const { data: user, isLoading: userLoading } = useUser();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<ActiveTab>("worksheet");

  const { data: worksheets, isLoading: worksheetsLoading } = useQuery<Worksheet[]>({
    queryKey: ["/api/user/worksheets"],
    enabled: !!user,
  });

  const { data: childrenData } = useChildren();
  const children: Child[] = childrenData || [];

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

  const folderMap: Map<string, { child: Child | null; items: Worksheet[] }> = new Map();

  if (children.length > 0) {
    for (const child of children) {
      folderMap.set(String(child.id), { child, items: [] });
    }
    folderMap.set("other", { child: null, items: [] });

    for (const ws of filteredItems) {
      const matched = matchChildToWorksheet(ws, children);
      if (matched) {
        folderMap.get(String(matched.id))!.items.push(ws);
      } else {
        folderMap.get("other")!.items.push(ws);
      }
    }
  }

  const hasFolderView = children.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav user={user} onLogout={() => logoutMutation.mutate()} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-page-title">
              My Worksheets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sorted.length > 0
                ? `${sorted.length} item${sorted.length !== 1 ? "s" : ""} generated`
                : "No worksheets yet"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button className="bg-gradient-primary text-white" data-testid="button-generate-worksheet">
                <Plus className="w-4 h-4 mr-1" /> New Worksheet
              </Button>
            </Link>
            <Link href="/test-prep">
              <Button variant="outline" data-testid="button-generate-test">
                <ClipboardList className="w-4 h-4 mr-1" /> New Test Paper
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("worksheet")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "worksheet" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-worksheets"
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Worksheets ({worksheetCount})
          </button>
          <button
            onClick={() => setActiveTab("test_prep")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "test_prep" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-test-papers"
          >
            <ClipboardList className="w-4 h-4 inline mr-1.5" />
            Test Papers ({testPrepCount})
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
            ) : (
              <ClipboardList className="w-16 h-16 text-muted-foreground/30 mb-4" />
            )}
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {activeTab === "worksheet" ? "No worksheets yet" : "No test papers yet"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {activeTab === "worksheet"
                ? "Generate your first worksheet to see it here."
                : "Create your first test paper to see it here."}
            </p>
            <Link href={activeTab === "worksheet" ? "/dashboard" : "/test-prep"}>
              <Button className="bg-gradient-primary text-white" data-testid="button-generate-first">
                <Plus className="w-4 h-4 mr-1" />
                {activeTab === "worksheet" ? "Generate Worksheet" : "Create Test Paper"}
              </Button>
            </Link>
          </div>
        ) : hasFolderView ? (
          <div data-testid="folder-view">
            {Array.from(folderMap.entries()).map(([key, { child, items }], idx) => {
              if (key === "other" && items.length === 0) return null;
              const label = child ? child.name : "Other / Unassigned";
              return (
                <ChildFolder
                  key={key}
                  label={label}
                  items={items}
                  isOther={key === "other"}
                  avatarColor={child ? AVATAR_COLORS[idx % AVATAR_COLORS.length] : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div data-testid="flat-view">
            {(() => {
              const bySubject: Record<string, Worksheet[]> = {};
              for (const ws of filteredItems) {
                const subj = ws.subject || "Other";
                if (!bySubject[subj]) bySubject[subj] = [];
                bySubject[subj].push(ws);
              }
              const subjects = Object.keys(bySubject).sort();
              return subjects.map((subj) => (
                <SubjectGroup key={subj} subject={subj} items={bySubject[subj]} />
              ));
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
