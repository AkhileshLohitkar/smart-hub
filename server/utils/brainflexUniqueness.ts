import crypto from "node:crypto";
import type { BrainFlexSection } from "../BrainFlexPuzzle";
import {
  extractBrainFlexUsedWords,
  extractBrainFlexUsedRiddles,
  extractBrainFlexUsedBrainTeasers,
} from "../BrainFlexPuzzle";

export type BrainFlexContentLike = {
  sections?: BrainFlexSection[];
  crossword?: { words?: string[]; crosswordAnswers?: string[] };
};

export type BrainFlexSignature = {
  hash: string;
  words: string[];
  riddles: string[];
  teasers: string[];
  sudokuSolutions: string[];
  wordSearchLayouts: string[];
  crosswordWords: string[];
};

function normQuestion(q: string): string {
  return String(q || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function overlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map((x) => x.toUpperCase()));
  let overlap = 0;
  for (const item of a) {
    if (setB.has(item.toUpperCase())) overlap++;
  }
  return overlap / Math.max(a.length, b.length);
}

function questionOverlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map(normQuestion));
  let overlap = 0;
  for (const item of a) {
    if (setB.has(normQuestion(item))) overlap++;
  }
  return overlap / Math.max(a.length, b.length);
}

/** Stable signature for comparing generations (ignores filler letters / minor layout noise). */
export function buildBrainFlexSignature(content: BrainFlexContentLike): BrainFlexSignature {
  const words = extractBrainFlexUsedWords(content);
  const riddles = extractBrainFlexUsedRiddles(content);
  const teasers = extractBrainFlexUsedBrainTeasers(content);
  const sudokuSolutions: string[] = [];
  const wordSearchLayouts: string[] = [];
  const crosswordWords: string[] = [];

  for (const section of content.sections ?? []) {
    if (section.type === "sudoku" && section.data && typeof section.data === "object") {
      const sol = (section.data as { solution?: number[][] }).solution;
      if (Array.isArray(sol)) {
        sudokuSolutions.push(sol.map((row) => row.join("")).join("|"));
      }
    }
    if (section.type === "word_search" && section.data && typeof section.data === "object") {
      const d = section.data as {
        words?: string[];
        answers?: Array<{ word?: string; row?: number; col?: number; direction?: string }>;
      };
      const layout = (d.answers ?? [])
        .map((a) => `${String(a.word || "").toUpperCase()}@${a.row},${a.col},${a.direction}`)
        .sort()
        .join(";");
      if (layout) wordSearchLayouts.push(layout);
    }
    if (section.type === "crossword" && section.data && typeof section.data === "object") {
      const c = section.data as {
        words?: string[];
        crosswordAnswers?: string[];
        answers?: Array<{ word?: string; row?: number; col?: number; direction?: string }>;
      };
      for (const w of c.crosswordAnswers ?? c.words ?? []) {
        crosswordWords.push(String(w).toUpperCase());
      }
      const layout = (c.answers ?? [])
        .map((a) => `${String(a.word || "").toUpperCase()}@${a.row},${a.col},${a.direction}`)
        .sort()
        .join(";");
      if (layout) wordSearchLayouts.push(`cw:${layout}`);
    }
  }

  if (content.crossword) {
    for (const w of content.crossword.crosswordAnswers ?? content.crossword.words ?? []) {
      crosswordWords.push(String(w).toUpperCase());
    }
  }

  const semantic = {
    words: [...words].sort(),
    riddles: [...riddles].sort(),
    teasers: [...teasers].sort(),
    sudokuSolutions: [...sudokuSolutions].sort(),
    wordSearchLayouts: [...wordSearchLayouts].sort(),
    crosswordWords: [...new Set(crosswordWords)].sort(),
  };

  const hash = crypto.createHash("sha256").update(JSON.stringify(semantic)).digest("hex");

  return { hash, ...semantic };
}

export function isBrainFlexTooSimilar(
  next: BrainFlexContentLike,
  recentSignatures: BrainFlexSignature[],
): boolean {
  if (recentSignatures.length === 0) return false;
  const sig = buildBrainFlexSignature(next);

  for (const prev of recentSignatures) {
    if (sig.hash === prev.hash) return true;

    const wordOverlap = overlapRatio(sig.words, prev.words);
    if (sig.words.length > 0 && wordOverlap >= 0.67) return true;

    const crosswordOverlap = overlapRatio(sig.crosswordWords, prev.crosswordWords);
    if (sig.crosswordWords.length > 0 && crosswordOverlap >= 0.6) return true;

    const riddleOverlap = questionOverlapRatio(sig.riddles, prev.riddles);
    if (sig.riddles.length > 0 && riddleOverlap >= 0.5) return true;

    const teaserOverlap = questionOverlapRatio(sig.teasers, prev.teasers);
    if (sig.teasers.length > 0 && teaserOverlap >= 0.5) return true;

    if (
      sig.sudokuSolutions.length > 0 &&
      prev.sudokuSolutions.length > 0 &&
      sig.sudokuSolutions.some((s) => prev.sudokuSolutions.includes(s))
    ) {
      return true;
    }

    if (
      sig.wordSearchLayouts.length > 0 &&
      prev.wordSearchLayouts.length > 0 &&
      sig.wordSearchLayouts.some((l) => prev.wordSearchLayouts.includes(l))
    ) {
      return true;
    }
  }

  return false;
}

export function makeGenerationSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function pickDifficultyHint(seed: number): "easy" | "medium" | "challenging" {
  const hints = ["easy", "medium", "challenging"] as const;
  return hints[seed % hints.length]!;
}
