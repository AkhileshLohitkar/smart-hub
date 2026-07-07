/**
 * Brain-Flex PDF only (jsPDF). Normal worksheets use html2canvas + WorksheetView.
 */
import { SUDOKU_SIZE, ensureSudokuPayload, formatSudokuCell } from "@shared/sudoku6x6";
import { resolveWordSearchCluesFromData } from "@shared/wordSearchClues";
import { joinPdfList, sanitizePdfText } from "@/lib/sanitizePdfText";
import { generateAnswerKeyQrDataUrl } from "@/components/WorksheetQrCode";

function puzzleTitle(type: string): string {
  switch (type) {
    case "word_search":
      return "Word Search";
    case "riddles":
      return "Fun Riddles";
    case "sudoku":
      return "Sudoku Challenge";
    case "boggles":
      return "Unscramble Words";
    case "brain_teasers":
      return "Brain Teasers";
    case "crossword":
      return "Crossword Puzzle";
    default:
      return "Puzzle";
  }
}

/** Normalize stored content to the flat "puzzle" rows the PDF drawer expects. */
export function getBrainFlexPuzzlesForPdf(content: unknown): any[] {
  const c = content as Record<string, unknown> | null | undefined;
  if (!c) return [];

  if (Array.isArray(c.sections)) {
    const rows = (c.sections as { type?: string; data?: unknown }[]).map((section) => {
      const type = String(section?.type || "");
      const title = puzzleTitle(type);
      const d = section.data as Record<string, unknown> | undefined;
      if (type === "word_search") {
        return {
          type,
          title,
          grid: d?.grid,
          words: d?.words,
          clues: d?.clues,
          wordsDetailed: d?.wordsDetailed,
          answers: d?.answers,
          size: d?.size,
        };
      }
      if (type === "sudoku") {
        return { type, title, grid: d?.grid, solution: d?.solution, size: d?.size };
      }
      if (type === "riddles") {
        return { type, title, riddles: d };
      }
      if (type === "brain_teasers") {
        return { type, title, problems: d };
      }
      if (type === "boggles") {
        return { type, title, words: d };
      }
      if (type === "crossword") {
        return {
          type,
          title,
          grid: d?.grid,
          words: d?.words,
          clues: d?.clues,
          crosswordAnswers: d?.crosswordAnswers,
        };
      }
      return { type, title, ...((d as object) || {}) };
    });
    const hasCw = rows.some((r) => String((r as { type?: string }).type) === "crossword");
    const top = c.crossword as Record<string, unknown> | undefined;
    if (top && Array.isArray(top.grid) && !hasCw) {
      rows.push({
        type: "crossword",
        title: puzzleTitle("crossword"),
        grid: top.grid,
        words: top.words,
        clues: top.clues,
        crosswordAnswers: top.crosswordAnswers,
      });
    }
    return rows;
  }

  if (Array.isArray(c.puzzles)) {
    return c.puzzles as any[];
  }

  const topOnly = c.crossword as Record<string, unknown> | undefined;
  if (topOnly && Array.isArray(topOnly.grid)) {
    return [
      {
        type: "crossword",
        title: puzzleTitle("crossword"),
        grid: topOnly.grid,
        words: topOnly.words,
        clues: topOnly.clues,
        crosswordAnswers: topOnly.crosswordAnswers,
      },
    ];
  }

  return [];
}

const BF_PDF_SECTION_ORDER = ["sudoku", "word_search", "riddles", "boggles", "brain_teasers", "crossword"] as const;

function sortPuzzlesForPdf(puzzles: any[]): any[] {
  return [...puzzles].sort((a, b) => {
    const ia = BF_PDF_SECTION_ORDER.indexOf(String(a?.type || "") as (typeof BF_PDF_SECTION_ORDER)[number]);
    const ib = BF_PDF_SECTION_ORDER.indexOf(String(b?.type || "") as (typeof BF_PDF_SECTION_ORDER)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export async function downloadBrainFlexPdf(
  worksheet: {
    className: string;
    difficulty: string;
    subject: string;
    topic: string;
    content: unknown;
  },
  id: number,
  toast: (opts: { title: string; description?: string; variant?: "destructive" }) => void,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const T = sanitizePdfText;

  const colors: Record<string, [number, number, number]> = {
    sudoku: [59, 130, 246],
    word_search: [234, 179, 8],
    riddles: [16, 185, 129],
    brain_teasers: [139, 92, 246],
    boggles: [239, 68, 68],
    crossword: [99, 102, 241],
  };

  const marginX = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  const ensureSpace = (yRef: { y: number }, needed: number) => {
    const bottom = 290;
    if (yRef.y + needed > bottom) {
      doc.addPage();
      yRef.y = 15;
    }
  };

  const puzzles = sortPuzzlesForPdf(getBrainFlexPuzzlesForPdf(worksheet.content));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text(T("Brain-Flex Puzzle Sheet"), marginX, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(T(`Grade: ${worksheet.className} | Difficulty: ${worksheet.difficulty}`), marginX, 22);

  doc.setDrawColor(200);
  doc.line(marginX, 25, pageWidth - marginX, 25);

  try {
    const qrDataUrl = await generateAnswerKeyQrDataUrl(id, 200, typeof window !== "undefined" ? window.location.origin : undefined);
    const qrSize = 22;
    doc.addImage(qrDataUrl, "PNG", pageWidth - marginX - qrSize, 8, qrSize, qrSize);
  } catch {
    // QR is optional; PDF still downloads without it
  }

  const yRef = { y: 32 };

  const sectionHeader = (type: string, title: string) => {
    ensureSpace(yRef, 12);
    const c = colors[type] ?? [37, 99, 235];
    doc.setFillColor(c[0], c[1], c[2]);
    doc.roundedRect(marginX, yRef.y, contentWidth, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(T(title), marginX + 2, yRef.y + 6);
    yRef.y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
  };

  const drawSudoku6x6 = (rawGrid: Array<Array<number | null>>, x: number) => {
    const { grid } = ensureSudokuPayload({ grid: rawGrid });
    const n = SUDOKU_SIZE;
    const cell = 7;
    const gridPx = cell * n;
    ensureSpace(yRef, gridPx + 6);

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const fill = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
        if (fill) {
          doc.setFillColor(239, 246, 255);
          doc.rect(x + c * cell, yRef.y + r * cell, cell, cell, "F");
        }
      }
    }

    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    doc.rect(x, yRef.y, gridPx, gridPx);
    for (let i = 1; i < n; i++) {
      if (i === 3) continue;
      doc.line(x + i * cell, yRef.y, x + i * cell, yRef.y + gridPx);
    }
    for (let i = 1; i < n; i++) {
      if (i === 2 || i === 4) continue;
      doc.line(x, yRef.y + i * cell, x + gridPx, yRef.y + i * cell);
    }
    doc.setDrawColor(60);
    doc.setLineWidth(0.6);
    doc.line(x + 3 * cell, yRef.y, x + 3 * cell, yRef.y + gridPx);
    doc.line(x, yRef.y + 2 * cell, x + gridPx, yRef.y + 2 * cell);
    doc.line(x, yRef.y + 4 * cell, x + gridPx, yRef.y + 4 * cell);
    doc.setLineWidth(0.2);
    doc.setDrawColor(150);

    doc.setTextColor(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const text = formatSudokuCell(grid[r]?.[c]);
        if (!text) continue;
        doc.text(T(text), x + c * cell + cell / 2, yRef.y + r * cell + cell / 2 + 1.1, {
          align: "center",
        } as any);
      }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    yRef.y += gridPx + 4;
  };

  const drawWordSearch = (wsGrid: string[][], clues: string[]) => {
    const sz = Array.isArray(wsGrid) ? wsGrid.length : 0;
    const cell = 6.5;
    const gridW = sz * cell;
    const x = marginX;

    ensureSpace(yRef, gridW + 28);

    doc.setDrawColor(180);
    doc.setLineWidth(0.2);
    doc.rect(x, yRef.y, gridW, gridW);
    for (let i = 1; i < sz; i++) {
      doc.line(x + i * cell, yRef.y, x + i * cell, yRef.y + gridW);
      doc.line(x, yRef.y + i * cell, x + gridW, yRef.y + i * cell);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30);
    for (let r = 0; r < sz; r++) {
      for (let c = 0; c < sz; c++) {
        const ch = wsGrid?.[r]?.[c] ?? "";
        doc.text(T(String(ch).slice(0, 1)), x + c * cell + cell / 2, yRef.y + r * cell + cell / 2 + 1.2, {
          align: "center",
        } as any);
      }
    }

    yRef.y += gridW + 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(T("Find the hidden words using clues:"), marginX, yRef.y);
    yRef.y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(30);
    clues.forEach((clue, i) => {
      const lines = doc.splitTextToSize(T(`${i + 1}. ${clue}`), contentWidth);
      ensureSpace(yRef, lines.length * 4 + 2);
      doc.text(lines, marginX, yRef.y);
      yRef.y += lines.length * 4 + 1.5;
    });

    yRef.y += 4;
    doc.setTextColor(0);
  };

  const drawQASection = (
    items: Array<{ question?: string; answer?: string }>,
    opts: { answerLines?: number; textColor?: [number, number, number] } = {},
  ) => {
    const answerLines = opts.answerLines ?? 1;
    if (opts.textColor) doc.setTextColor(opts.textColor[0], opts.textColor[1], opts.textColor[2]);
    else doc.setTextColor(30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let idx = 1;
    for (const it of items || []) {
      const q = String(it?.question ?? "").trim();
      if (!q) continue;
      ensureSpace(yRef, 12 + answerLines * 6);

      const lines = doc.splitTextToSize(T(`${idx}. ${q}`), contentWidth);
      doc.text(lines, marginX, yRef.y);
      yRef.y += lines.length * 4.5;

      doc.setDrawColor(220);
      for (let i = 0; i < answerLines; i++) {
        doc.line(marginX, yRef.y + i * 6, marginX + 150, yRef.y + i * 6);
      }
      yRef.y += answerLines * 6 + 5;
      idx++;
    }

    doc.setTextColor(0);
  };

  const drawCrossword = (cwGrid: string[][], cluesRaw: unknown[]) => {
    const rows = Array.isArray(cwGrid) ? cwGrid.length : 0;
    const cols = rows > 0 && Array.isArray(cwGrid[0]) ? cwGrid[0]!.length : 0;
    if (rows === 0 || cols === 0) return;

    const cell = 5.2;
    const gridW = cols * cell;
    const gridH = rows * cell;
    const x0 = marginX;

    ensureSpace(yRef, gridH + 32);

    doc.setDrawColor(120);
    doc.setLineWidth(0.15);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = String(cwGrid[r]?.[c] ?? "");
        const isBlock = ch === "#" || ch === "·";
        const gx = x0 + c * cell;
        const gy = yRef.y + r * cell;
        if (isBlock) {
          doc.setFillColor(30, 30, 30);
          doc.rect(gx, gy, cell, cell, "F");
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(gx, gy, cell, cell, "F");
        }
        doc.rect(gx, gy, cell, cell, "S");
        if (!isBlock && ch) {
          doc.setTextColor(20);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text(T(ch), gx + cell / 2, gy + cell / 2 + 1.2, { align: "center" } as any);
        }
      }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);

    yRef.y += gridH + 6;
    doc.setTextColor(60);
    doc.setFontSize(9);
    doc.text(T("Clues:"), marginX, yRef.y);
    yRef.y += 4;
    let fallbackNum = 1;
    for (const clue of cluesRaw || []) {
      let q = "";
      let num = fallbackNum;
      if (typeof clue === "string") {
        q = clue.trim();
      } else if (clue && typeof clue === "object") {
        const o = clue as Record<string, unknown>;
        if (typeof o.clue === "string") q = o.clue.trim();
        if (typeof o.number === "number") num = o.number;
      }
      if (!q) continue;
      const lines = doc.splitTextToSize(T(`${num}. ${q}`), contentWidth);
      ensureSpace(yRef, lines.length * 4 + 2);
      doc.text(lines, marginX, yRef.y);
      yRef.y += lines.length * 4 + 1.5;
      fallbackNum++;
    }
    doc.setTextColor(0);
    yRef.y += 4;
  };

  const drawBoggles = (words: Array<{ scrambled?: string; original?: string; hint?: string }>) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let idx = 1;
    for (const w of words || []) {
      ensureSpace(yRef, 10);
      const scrambled = String(w?.scrambled ?? "").toUpperCase();
      const hint = String(w?.hint ?? "Hint").trim();
      doc.setTextColor(239, 68, 68);
      doc.text(T(`${idx}. ${scrambled}`), marginX, yRef.y);
      doc.setTextColor(100);
      doc.text(T(`(${hint})`), marginX + 55, yRef.y);
      doc.setDrawColor(220);
      doc.line(marginX + 95, yRef.y + 1, marginX + 170, yRef.y + 1);
      yRef.y += 8;
      idx++;
    }
    doc.setTextColor(0);
  };

  for (const p of puzzles) {
    const type = String(p?.type || "");
    const title = T(String(p?.title || "").trim()) || "Puzzle";

    sectionHeader(type, title);

    if (type === "sudoku") {
      const { grid } = ensureSudokuPayload(p);
      drawSudoku6x6(grid, marginX);
      yRef.y += 2;
      continue;
    }

    if (type === "word_search") {
      const clues = resolveWordSearchCluesFromData(p);
      drawWordSearch(p?.grid ?? [], clues);
      yRef.y += 2;
      continue;
    }

    if (type === "riddles") {
      drawQASection(p?.riddles ?? [], { answerLines: 1, textColor: [30, 30, 30] });
      yRef.y += 2;
      continue;
    }

    if (type === "brain_teasers") {
      drawQASection(p?.problems ?? [], { answerLines: 1, textColor: [80, 80, 80] });
      yRef.y += 2;
      continue;
    }

    if (type === "boggles") {
      drawBoggles(p?.words ?? []);
      yRef.y += 2;
      continue;
    }

    if (type === "crossword") {
      drawCrossword(p?.grid ?? [], p?.clues ?? []);
      yRef.y += 2;
      continue;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80);
    const raw = doc.splitTextToSize(T(JSON.stringify(p ?? {}, null, 2)), contentWidth);
    ensureSpace(yRef, 20);
    doc.text(raw.slice(0, 20), marginX, yRef.y);
    yRef.y += 20;
    doc.setTextColor(0);
  }

  const fileName = T(`QikWorksheet_${worksheet?.subject}_${worksheet?.topic}_${id}.pdf`).replace(/\s+/g, "_");
  doc.save(fileName);

  try {
    await fetch(`/api/worksheets/${id}/download`, { method: "POST" });
  } catch {
    /* ignore */
  }

  toast({ title: "Downloaded!", description: "Your Brain-Flex PDF has been saved." });
}
