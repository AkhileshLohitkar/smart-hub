import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, LogOut, User, Loader2, Plus, Star, FileText, Calendar } from "lucide-react";
import type { Worksheet } from "@shared/schema";

export default function History() {
  const { data: user, isLoading: userLoading } = useUser();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();

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
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-gradient-primary" data-testid="logo-text">Qik Worksheets</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="link-generate-new">
                <Plus className="w-4 h-4 mr-1" /> Generate New
              </Button>
            </Link>
            {user && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span data-testid="text-username">{user.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-primary text-white font-medium capitalize" data-testid="text-plan">
                    {user.plan}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="text-muted-foreground"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-page-title">My Worksheets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sorted.length > 0
                ? `${sorted.length} worksheet${sorted.length !== 1 ? "s" : ""} generated`
                : "No worksheets yet"}
            </p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-gradient-primary text-white" data-testid="button-generate-worksheet">
              <Plus className="w-4 h-4 mr-1" /> New Worksheet
            </Button>
          </Link>
        </div>

        {worksheetsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-state">
            <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No worksheets yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Generate your first worksheet to see it here. All your worksheets will be saved for easy access.
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-primary text-white" data-testid="button-generate-first">
                <Plus className="w-4 h-4 mr-1" /> Generate Your First Worksheet
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((ws) => (
              <Link key={ws.id} href={`/worksheet/${ws.id}`}>
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

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span data-testid={`text-date-${ws.id}`}>
                      {ws.createdAt
                        ? new Date(ws.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Unknown date"}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
