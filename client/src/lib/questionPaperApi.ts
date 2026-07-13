import { apiRequest } from "@/lib/queryClient";

/**
 * Question Paper Studio — client API, types, and helpers.
 *
 * Self-contained module. Reuses the shared apiRequest helper but does not touch
 * any existing worksheet / notes / brain-flex code.
 */

// ---- Boards & grades (extensible) ------------------------------------------
// Architecture note: adding a future board is a one-line addition here.
export const QP_BOARDS: string[] = [
  "CBSE",
  "ICSE",
  "ISC",
  "Maharashtra State Board",
  "Karnataka State Board",
  "Tamil Nadu Board",
  "Telangana Board",
  "Andhra Pradesh Board",
  "Gujarat Board",
  "Rajasthan Board",
  "Punjab Board",
  "Haryana Board",
  "Kerala Board",
  "NIOS",
];

export const QP_GRADES: string[] = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

// ---- Upload limits ---------------------------------------------------------
export const QP_MAX_FILE_BYTES = 1 * 1024 * 1024; // 1 MB
export const QP_MAX_PDF_PAGES = 4;
export const QP_FILE_SIZE_ERROR =
  "Maximum file size allowed is 1 MB. Please upload a smaller PDF or image.";
export const QP_PDF_PAGES_ERROR =
  "Only PDFs with up to 4 pages are supported. Please upload a PDF with 4 pages or fewer.";

export function isSupportedQpFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return true;
  if (type === "image/jpeg" || type === "image/jpg" || type === "image/png") return true;
  if (/\.(jpe?g|png)$/i.test(name)) return true;
  return false;
}

export function validateQpUploadFile(file: File): void {
  if (!isSupportedQpFile(file)) {
    throw new Error(`${file.name} is not a supported file (use PDF, JPG, or PNG).`);
  }
  if (file.size > QP_MAX_FILE_BYTES) {
    throw new Error(QP_FILE_SIZE_ERROR);
  }
}

// ---- Types -----------------------------------------------------------------
export interface PaperImage {
  base64: string; // full data URL
  mimeType: string;
  name: string;
  dataUrl: string;
  size: number;
  /** Original source file size in bytes (pre-compression). */
  sourceFileSize?: number;
}

export interface PaperLayoutProfile {
  style: "generic" | "nested_board";
  showSeatNo?: boolean;
  paperCodeLine?: string;
  timeMarksLine?: string;
  instructionsPrefix?: string;
  mcqOptionStyle?: "upper_alpha_paren" | "lower_alpha_paren";
  subQuestionNumbering?: "roman_lower" | "numeric";
  marksOnSectionHeader?: boolean;
}

export interface PaperSectionPlan {
  name: string;
  description?: string;
  questionType: string;
  questionCount: number;
  marksPerQuestion: number;
  hasInternalChoice?: boolean;
  /** Full printed header e.g. "1 (A) Choose the correct alternative" */
  headerLine?: string;
  /** Total marks shown after colon on section header */
  sectionMarks?: number;
  /** e.g. "all", "any two", "any three", "any five", "any one" */
  answerRule?: string;
  parentQuestionNumber?: string;
  subSectionLetter?: string;
}

export interface PaperAnalysis {
  board: string;
  className: string;
  subject: string;
  chapters: string[];
  totalMarks: number;
  durationMinutes: number;
  difficulty: string;
  generalInstructions: string[];
  sections: PaperSectionPlan[];
  detectedQuestionTypes: string[];
  layoutProfile?: PaperLayoutProfile;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface QuestionSubPart {
  label: string;
  text: string;
}

export interface GeneratedQuestion {
  number: string;
  text: string;
  questionType: string;
  marks: number;
  options?: string[];
  matchPairs?: MatchPair[];
  internalChoice?: string;
  answerLines?: number;
  subParts?: QuestionSubPart[];
}

export interface GeneratedSection {
  name: string;
  description?: string;
  headerLine?: string;
  sectionMarks?: number;
  answerRule?: string;
  parentQuestionNumber?: string;
  subSectionLetter?: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  title: string;
  board: string;
  className: string;
  subject: string;
  totalMarks: number;
  durationMinutes: number;
  generalInstructions: string[];
  sections: GeneratedSection[];
  layoutProfile?: PaperLayoutProfile;
  paperCodeLine?: string;
  timeMarksLine?: string;
}

export interface AnswerKeyEntry {
  section: string;
  number: string;
  answer: string;
}

export interface GenerateResult {
  id?: number;
  paper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
}

// ---- API calls -------------------------------------------------------------
function parseApiError(err: any, fallback: string): string {
  try {
    const parsed = JSON.parse(err.message.split(": ").slice(1).join(": "));
    return parsed.message || fallback;
  } catch {
    return err?.message || fallback;
  }
}

export async function analyzePaper(input: {
  board: string;
  className: string;
  subject: string;
  images: PaperImage[];
}): Promise<PaperAnalysis> {
  try {
    const maxSourceFileSize = input.images.reduce(
      (max, img) => Math.max(max, img.sourceFileSize ?? 0),
      0,
    );
    const res = await apiRequest("POST", "/api/question-papers/analyze", {
      board: input.board,
      className: input.className,
      subject: input.subject,
      images: input.images.map((img) => ({
        base64: img.dataUrl,
        mimeType: img.mimeType,
        sourceFileSize: img.sourceFileSize,
      })),
      pageCount: input.images.length,
      sourceFileSizeBytes: maxSourceFileSize || undefined,
    });
    const data = await res.json();
    return data.analysis as PaperAnalysis;
  } catch (err) {
    throw new Error(parseApiError(err, "Failed to analyze the question paper."));
  }
}

export async function generatePaper(input: {
  board: string;
  className: string;
  subject: string;
  topic?: string;
  analysis: PaperAnalysis;
}): Promise<GenerateResult> {
  try {
    const res = await apiRequest("POST", "/api/question-papers/generate", input);
    return (await res.json()) as GenerateResult;
  } catch (err) {
    throw new Error(parseApiError(err, "Failed to generate the question paper."));
  }
}

// ---- File handling ---------------------------------------------------------
function compressImageFile(file: File): Promise<PaperImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_SIDE = 2048;
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
        if (!ctx) {
          reject(new Error("Canvas error"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.82;
        const TARGET = 3.5 * 1024 * 1024;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length * 0.75 > TARGET && quality > 0.35) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        const base64 = dataUrl.split(",")[1] || "";
        resolve({
          base64,
          dataUrl,
          mimeType: "image/jpeg",
          name: file.name,
          size: Math.round(base64.length * 0.75),
          sourceFileSize: file.size,
        });
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = src;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

// Convert a PDF into page images entirely in the browser using pdfjs-dist.
async function pdfFileToImages(file: File, maxPages = QP_MAX_PDF_PAGES): Promise<PaperImage[]> {
  const pdfjs: any = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  if (doc.numPages > QP_MAX_PDF_PAGES) {
    throw new Error(QP_PDF_PAGES_ERROR);
  }
  const pages = Math.min(doc.numPages, maxPages);
  const out: PaperImage[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1] || "";
    out.push({
      base64,
      dataUrl,
      mimeType: "image/jpeg",
      name: `${file.name} — page ${i}`,
      size: Math.round(base64.length * 0.75),
      sourceFileSize: file.size,
    });
  }
  return out;
}

// Turn any accepted file (image or PDF) into one or more page images.
export async function fileToPaperImages(file: File): Promise<PaperImage[]> {
  validateQpUploadFile(file);

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (isPdf) {
    return pdfFileToImages(file, QP_MAX_PDF_PAGES);
  }
  if (
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    file.type === "image/png" ||
    /\.(jpe?g|png)$/i.test(file.name)
  ) {
    return [await compressImageFile(file)];
  }
  throw new Error(`${file.name} is not a supported file (use PDF, JPG, or PNG).`);
}

// ---- PDF export ------------------------------------------------------------
// Renders a DOM element to a paginated A4 PDF (no watermark).
export async function downloadElementAsPdf(element: HTMLElement, fileName: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const a4WidthPx = 794;
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const usableWidth = pdfWidth - margin * 2;
  const usableHeightMm = pdfHeight - margin * 2;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.left = "-100000px";
  clone.style.top = "0";
  clone.style.width = `${a4WidthPx}px`;
  clone.style.background = "#ffffff";
  document.body.appendChild(clone);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: a4WidthPx,
      width: a4WidthPx,
    });
  } finally {
    clone.remove();
  }

  const scaleFactor = usableWidth / canvas.width;
  const sourcePageHeightPx = usableHeightMm / scaleFactor;
  const totalPages = Math.max(1, Math.ceil(canvas.height / sourcePageHeightPx));

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();
    const sy = page * sourcePageHeightPx;
    const sh = Math.min(sourcePageHeightPx, canvas.height - sy);
    const sw = canvas.width;
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = sw;
    pageCanvas.height = sh;
    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sw, sh);
      ctx.drawImage(canvas, 0, sy, sw, sh, 0, 0, sw, sh);
    }
    const imgData = pageCanvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", margin, margin, usableWidth, sh * scaleFactor);
  }

  pdf.save(fileName.replace(/\s+/g, "_"));
}
