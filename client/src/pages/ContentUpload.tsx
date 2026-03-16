import { useState, useRef } from "react";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Upload,
  Trash2,
  BookOpen,
  Loader2,
  CheckCircle,
  ImagePlus,
  X,
  Info,
  Sparkles,
  FileText,
  PenLine,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import type { ContentUpload as ContentUploadType } from "@shared/schema";

const GRADES = [
  "Nursery", "KG 1", "KG 2",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
  "High School",
];

const BOARDS = [
  "CBSE", "ICSE", "IGCSE",
  "State Board - Maharashtra",
  "State Board - Andhra Pradesh",
  "State Board - Tamil Nadu",
  "Common Core",
];

interface PreviewImage {
  base64: string;
  mimeType: string;
  name: string;
  dataUrl: string;
  size: number;
}

export default function ContentUpload() {
  const { data: user, isLoading: userLoading } = useUser();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<"photos" | "text">("photos");
  const [board, setBoard] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [sourceDescription, setSourceDescription] = useState("");
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [typedText, setTypedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!userLoading && !user) setLocation("/auth");
  }, [user, userLoading, setLocation]);

  const { data: uploads, isLoading: uploadsLoading } = useQuery<ContentUploadType[]>({
    queryKey: ["/api/content"],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/content/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ title: "Deleted", description: "Content removed successfully." });
    },
  });

  const compressImage = (file: File): Promise<PreviewImage> => {
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
          if (!ctx) { reject(new Error("Canvas error")); return; }
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
          const approxBytes = base64.length * 0.75;
          resolve({
            base64,
            mimeType: "image/jpeg",
            name: file.name,
            dataUrl,
            size: Math.round(approxBytes),
          });
        };
        img.onerror = () => reject(new Error("Could not load image"));
        img.src = originalDataUrl;
      };
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast({ title: "Too many images", description: "Maximum 10 images per upload.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: `${f.name} is not an image.`, variant: "destructive" });
        return false;
      }
      return true;
    });
    e.target.value = "";
    if (validFiles.length === 0) return;
    setIsCompressing(true);
    for (const file of validFiles) {
      try {
        const compressed = await compressImage(file);
        setImages((prev) => [...prev, compressed]);
      } catch {
        toast({ title: "Could not load image", description: `${file.name} could not be processed.`, variant: "destructive" });
      }
    }
    setIsCompressing(false);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (!board || !className || !subject || images.length === 0) {
      toast({ title: "Missing fields", description: "Please fill in Board, Grade, Subject, and add at least one image.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const payload = {
        board,
        className,
        subject,
        chapter,
        topic,
        sourceDescription,
        images: images.map((img) => ({ base64: img.dataUrl, mimeType: img.mimeType })),
      };
      await apiRequest("POST", "/api/content/upload", payload);
      qc.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Content saved!",
        description: "Text extracted from your photos and saved. Your images are not stored — only the text.",
      });
      setImages([]);
      setChapter("");
      setTopic("");
      setSourceDescription("");
    } catch (err: any) {
      let msg = "Upload failed. Please try again.";
      try { msg = JSON.parse(err.message.split(": ").slice(1).join(": ")).message || msg; } catch {}
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveText = async () => {
    if (!board || !className || !subject || typedText.trim().length < 10) {
      toast({ title: "Missing fields", description: "Please fill in Board, Grade, Subject, and enter at least 10 characters of notes.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      await apiRequest("POST", "/api/content/save-text", {
        board, className, subject, chapter, topic, text: typedText, sourceDescription,
      });
      qc.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ title: "Notes saved!", description: "Your text has been saved and will be used when generating worksheets for this topic." });
      setTypedText("");
      setChapter("");
      setTopic("");
      setSourceDescription("");
    } catch (err: any) {
      let msg = "Save failed. Please try again.";
      try { msg = JSON.parse(err.message.split(": ").slice(1).join(": ")).message || msg; } catch {}
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setIsUploading(false);
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

  const commonFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Board *</Label>
          <Select value={board} onValueChange={setBoard}>
            <SelectTrigger className="h-10" data-testid="select-upload-board">
              <SelectValue placeholder="Select board" />
            </SelectTrigger>
            <SelectContent>
              {BOARDS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Grade *</Label>
          <Select value={className} onValueChange={setClassName}>
            <SelectTrigger className="h-10" data-testid="select-upload-grade">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Subject *</Label>
        <Input
          placeholder="e.g. Mathematics, Science, English"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-10"
          data-testid="input-upload-subject"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Chapter (optional)</Label>
          <Input
            placeholder="e.g. Chapter 5"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="h-10"
            data-testid="input-upload-chapter"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Topic (optional)</Label>
          <Input
            placeholder="e.g. Photosynthesis"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-10"
            data-testid="input-upload-topic"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Note (optional)</Label>
        <Input
          placeholder="e.g. Pages 42–55, Unit 3 exercises"
          value={sourceDescription}
          onChange={(e) => setSourceDescription(e.target.value)}
          className="h-10"
          data-testid="input-upload-note"
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav user={user} onLogout={() => logoutMutation.mutate()} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-primary rounded-xl text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">My Notes</h1>
              <p className="text-sm text-muted-foreground">Save textbook content to generate more accurate, chapter-specific worksheets</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-6" data-testid="info-banner">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Only text is saved — your images are never stored</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Upload photos of your textbook pages and our AI will read and extract the text for you, or type/paste your notes directly. The saved text is then used when generating worksheets for that topic.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg" data-testid="tab-switcher">
              <button
                onClick={() => setInputMode("photos")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${inputMode === "photos" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="tab-photos"
              >
                <Camera className="w-4 h-4" />
                Upload Photos
              </button>
              <button
                onClick={() => setInputMode("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${inputMode === "text" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="tab-type"
              >
                <PenLine className="w-4 h-4" />
                Type Notes
              </button>
            </div>

            {commonFields}

            {inputMode === "photos" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-file"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="w-full border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-6 flex flex-col items-center gap-2 transition-colors cursor-pointer bg-primary/5 hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
                  data-testid="button-add-images"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary/60 animate-spin" />
                      <span className="text-sm font-semibold text-primary/80">Optimising image...</span>
                      <span className="text-xs text-muted-foreground">Resizing for AI reading</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-primary/60" />
                      <span className="text-sm font-semibold text-primary/80">Tap to add photos</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG, HEIC • Any size — auto-compressed • Up to 10 pages</span>
                    </>
                  )}
                </button>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2" data-testid="image-previews">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border" data-testid={`preview-image-${idx}`}>
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-image-${idx}`}
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

                {images.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {images.length} page{images.length > 1 ? "s" : ""} ready
                    {" · "}total {((images.reduce((s, i) => s + i.size, 0)) / (1024 * 1024)).toFixed(1)} MB after compression
                  </p>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={isUploading || images.length === 0 || !board || !className || !subject}
                  className="w-full bg-gradient-primary text-white font-semibold rounded-xl h-11"
                  data-testid="button-upload-submit"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Reading pages... (this may take a moment)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract Text & Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Notes / Textbook Content *</Label>
                  <Textarea
                    placeholder="Paste or type your textbook content, chapter notes, definitions, formulas, or any study material here...&#10;&#10;The more detailed the content, the more accurate your worksheets will be."
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    className="min-h-[200px] text-sm resize-y"
                    data-testid="textarea-notes"
                  />
                  <p className="text-xs text-muted-foreground text-right">{typedText.length} characters</p>
                </div>

                <Button
                  onClick={handleSaveText}
                  disabled={isUploading || typedText.trim().length < 10 || !board || !className || !subject}
                  className="w-full bg-gradient-primary text-white font-semibold rounded-xl h-11"
                  data-testid="button-text-submit"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Save Notes
                    </>
                  )}
                </Button>
              </>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" /> Tips for best results
            </h2>
            {inputMode === "photos" ? (
              <div className="space-y-3">
                {[
                  { icon: "📸", title: "Good lighting", desc: "Take photos in bright, even lighting. Avoid shadows across the page." },
                  { icon: "📐", title: "Keep it straight", desc: "Hold your phone directly above the page, as flat as possible." },
                  { icon: "🔍", title: "Full page", desc: "Capture the entire page including headings, diagrams, and examples." },
                  { icon: "📖", title: "Multiple pages", desc: "Upload all pages of a chapter together — the AI reads them in order." },
                  { icon: "✅", title: "One topic at a time", desc: "Upload pages per chapter or topic for the most accurate results." },
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{tip.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: "📋", title: "Copy from e-books", desc: "Copy and paste text from PDF textbooks or digital resources directly." },
                  { icon: "📝", title: "Include definitions", desc: "Paste key terms, definitions, formulas, and examples from the chapter." },
                  { icon: "🔢", title: "Add examples", desc: "Include solved examples — the AI will create similar practice questions from them." },
                  { icon: "📚", title: "One chapter at a time", desc: "Save content chapter by chapter for the most targeted worksheet questions." },
                  { icon: "✅", title: "More detail = better questions", desc: "The more content you add, the more accurate and varied the questions will be." },
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{tip.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Saved Content Library
            {uploads && uploads.length > 0 && (
              <Badge variant="secondary" className="text-xs">{uploads.length} saved</Badge>
            )}
          </h2>

          {uploadsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-60" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : uploads && uploads.length > 0 ? (
            <div className="space-y-3">
              {uploads.map((upload) => {
                const isExpanded = expandedId === upload.id;
                const preview = upload.extractedText?.slice(0, 200);
                const hasMore = (upload.extractedText?.length || 0) > 200;
                return (
                  <Card key={upload.id} className="p-4" data-testid={`card-upload-${upload.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                          {upload.pageCount === 0 ? (
                            <PenLine className="w-5 h-5 text-white" />
                          ) : (
                            <Camera className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate" data-testid={`text-upload-subject-${upload.id}`}>
                            {upload.subject} {upload.chapter ? `— ${upload.chapter}` : ""}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <Badge variant="secondary" className="text-xs">{upload.board}</Badge>
                            <Badge variant="outline" className="text-xs">{upload.className}</Badge>
                            {upload.topic && <Badge variant="outline" className="text-xs text-primary border-primary/30">{upload.topic}</Badge>}
                            {upload.pageCount > 0 ? (
                              <Badge variant="outline" className="text-xs text-muted-foreground">{upload.pageCount} photo{upload.pageCount !== 1 ? "s" : ""}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">Typed notes</Badge>
                            )}
                          </div>
                          {upload.sourceDescription && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{upload.sourceDescription}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <p className="text-xs text-green-600 dark:text-green-400">Active — used in worksheet generation</p>
                          </div>

                          {upload.extractedText && (
                            <div className="mt-3 border-t border-border pt-3">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : upload.id)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2"
                                data-testid={`button-toggle-text-${upload.id}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {isExpanded ? "Hide saved content" : "View saved content"}
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                              {isExpanded ? (
                                <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto" data-testid={`text-content-${upload.id}`}>
                                  {upload.extractedText}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground italic line-clamp-2">
                                  {preview}{hasMore ? "…" : ""}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0" data-testid={`button-delete-upload-${upload.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this content?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the saved content for <strong>{upload.subject}</strong>. Worksheets will no longer use this content.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(upload.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-testid="button-confirm-delete-upload"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-10 text-center border-dashed" data-testid="empty-uploads">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="font-semibold text-foreground mb-1">No content saved yet</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Upload textbook photos or type your notes above to help the AI generate more accurate, chapter-specific worksheets.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
