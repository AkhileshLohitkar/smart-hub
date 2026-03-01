import { useEffect, useState } from "react";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useChildren, useCreateChild, useDeleteChild } from "@/hooks/use-children";
import { Link, useLocation } from "wouter";
import { LogOut, User, Loader2, Plus, Trash2, Users } from "lucide-react";
import logoImage from "@assets/IMG_6540_1772323083109.jpg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const boards = ["CBSE", "ICSE", "IGCSE", "State Board", "Common Core"];
const grades = [
  "Nursery", "KG 1", "KG 2",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
  "High School",
];

export default function Children() {
  const { data: user, isLoading: userLoading } = useUser();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const { data: children, isLoading: childrenLoading } = useChildren();
  const createChild = useCreateChild();
  const deleteChild = useDeleteChild();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [board, setBoard] = useState("");
  const [className, setClassName] = useState("");

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

  const maxChildren = user.maxChildren || 1;
  const currentCount = children?.length || 0;
  const canAdd = currentCount < maxChildren;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !board || !className) return;
    createChild.mutate(
      { name: name.trim(), board, className },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setName("");
          setBoard("");
          setClassName("");
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src={logoImage} alt="Qik Worksheet" className="w-32 h-32 rounded-lg object-contain drop-shadow-md logo-vibrant" data-testid="logo-image" />
            <span className="text-xl font-display font-bold text-gradient-primary" data-testid="logo-text">Qik Worksheets</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="link-dashboard">Dashboard</Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" size="sm" data-testid="link-history">My Worksheets</Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span data-testid="text-username">{user.name}</span>
              <Badge variant="secondary" className="text-xs capitalize" data-testid="text-plan">
                {user.plan}
              </Badge>
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
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2" data-testid="heading-children">
                <Users className="w-6 h-6" />
                My Children
              </h1>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-children-count">
                {currentCount} of {maxChildren} children added
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={!canAdd}
                  className="bg-gradient-primary text-white"
                  data-testid="button-add-child"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Child
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a Child</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="child-name">Name</Label>
                    <Input
                      id="child-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter child's name"
                      required
                      data-testid="input-child-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child-board">Board</Label>
                    <Select value={board} onValueChange={setBoard} required>
                      <SelectTrigger data-testid="select-child-board">
                        <SelectValue placeholder="Select board" />
                      </SelectTrigger>
                      <SelectContent>
                        {boards.map((b) => (
                          <SelectItem key={b} value={b} data-testid={`option-board-${b}`}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child-grade">Grade</Label>
                    <Select value={className} onValueChange={setClassName} required>
                      <SelectTrigger data-testid="select-child-grade">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g} value={g} data-testid={`option-grade-${g}`}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary text-white"
                    disabled={createChild.isPending || !name.trim() || !board || !className}
                    data-testid="button-submit-child"
                  >
                    {createChild.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : null}
                    Add Child
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {!canAdd && currentCount >= maxChildren && (
            <Card className="p-4 mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200" data-testid="text-limit-warning">
                You've reached the maximum number of children for your <span className="font-semibold capitalize">{user.plan}</span> plan.
                Upgrade your plan to add more children.
              </p>
            </Card>
          )}

          {childrenLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : children && children.length > 0 ? (
            <div className="space-y-3">
              {children.map((child) => (
                <Card key={child.id} className="p-4" data-testid={`card-child-${child.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {child.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate" data-testid={`text-child-name-${child.id}`}>
                          {child.name}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-child-board-${child.id}`}>
                            {child.board}
                          </Badge>
                          <Badge variant="outline" className="text-xs" data-testid={`badge-child-grade-${child.id}`}>
                            {child.className}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground flex-shrink-0"
                          data-testid={`button-delete-child-${child.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete child profile?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <span className="font-semibold">{child.name}</span>'s profile. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteChild.mutate(child.id)}
                            className="bg-destructive text-destructive-foreground"
                            data-testid="button-confirm-delete"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="empty-children">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="text-muted-foreground mb-1">No children added yet</p>
              <p className="text-sm text-muted-foreground">
                Add a child profile to pre-fill board and grade when generating worksheets.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
