import { pickBrainflexWordsForContext, getBrainflexWordClue } from "./utils/brainflexWords";
import { getWordSearchDisplayClue } from "./utils/wordMeanings";
import { generateCrosswordEngine } from "./utils/generateCrossword";
import { generateSudoku6x6, isSudoku6x6Matrix } from "@shared/sudoku6x6";
import {
  type BrainFlexContext,
  shuffle,
  pickRiddles,
  pickBrainTeasers,
  getContextGradeBand,
  isGenericBrainFlexSubject,
} from "./utils/brainflexContext";
import { getGradeWordLimits, NEUTRAL_WORD_BANK } from "./utils/brainflexCurriculum";
import { seededShuffle } from "./utils/brainflexUniqueness";

/**
 * Brain-Flex puzzle generation only (isolated from normal worksheet AI flow).
 * Stored shape: { title, theme?, graphicEmojis?, sections: { type, data }[] }
 */

export function normalizeBrainFlexTypeId(raw: string): string | null {
  const t = String(raw).trim().replace(/-/g, "_").toLowerCase();
  const aliases: Record<string, string> = {
    riddle: "riddles",
    unscramble: "boggles",
    unscramble_words: "boggles",
    word_scramble: "boggles",
    brain_teaser: "brain_teasers",
    brainteasers: "brain_teasers",
    cross_word: "crossword",
  };
  const mapped = aliases[t] ?? t;
  const allowed = new Set(["word_search", "riddles", "sudoku", "boggles", "brain_teasers", "crossword"]);
  return allowed.has(mapped) ? mapped : null;
}

const CROSSWORD_CLUE_MAP: Record<string, string> = {
  MATH: "Subject with numbers, shapes, and equations",
  LOGIC: "Clear reasoning step by step",
  BRAIN: "The organ you think with",
  PUZZLE: "A problem made for fun",
  THINK: "Use your mind carefully",
  FOCUS: "Pay close attention",
  LEARN: "Gain knowledge or a skill",
  SMART: "Quick to learn and clever",
  NUMBER: "Something you can count",
  CODE: "Instructions for a computer",
  GRID: "Rows and columns of squares",
  SOLVE: "Find the answer",
  MEMORY: "What helps you remember facts",
  PATTERN: "A repeating design or order",
  QUIZ: "A short set of questions",
  MIND: "Your thinking ability",
  SKILL: "Something you get better at with practice",
  STUDY: "Work hard to learn a lesson",
  BRIGHT: "Quick and clever",
  TRAIN: "Practice to get stronger at something",
  BOOK: "Pages you read to learn",
  READ: "Look at words and understand them",
  WRITE: "Put words onto paper",
  WORD: "A unit of language",
  GAME: "An activity played for fun",
  CLASS: "A group of students learning together",
  SCHOOL: "A place where children learn",
  GRADE: "A school level or year",
  SCIENCE: "Study of nature and how things work",
  ENGLISH: "A language studied at school",
};

/** Crossword-only educational bank when Curriculum Focus is empty (does not affect other generators). */
const CROSSWORD_GENERIC_BANK: string[] = [
  ...Object.keys(CROSSWORD_CLUE_MAP),
  ...NEUTRAL_WORD_BANK,
];

export type CrosswordClueEntry = { number: number; clue: string; answer: string };

export type CrosswordPlaced = {
  word: string;
  row: number;
  col: number;
  direction: "across" | "down";
  /** Starting clue number for this placed word (top-left cell). */
  number?: number;
  /** Child-friendly clue (no answer revealed). */
  clue?: string;
};

export type CrosswordPayload = {
  /** Solution grid. Blocked cells are '#'. */
  grid: string[][];
  /** Legacy / compatibility list of placed words. */
  words: string[];
  wordsDetailed?: Array<{ word: string; meaning: string }>;
  /** Legacy combined clue list. */
  clues: CrosswordClueEntry[];
  crosswordAnswers: string[];
  /** Legacy placement list. */
  answers: CrosswordPlaced[];

  /** Premium worksheet fields (preferred by renderer). */
  across?: CrosswordClueEntry[];
  down?: CrosswordClueEntry[];
  wordBank?: string[];
  clueNumbersGrid?: Array<Array<number | null>>;
  placedWords?: CrosswordPlaced[];
};

function makeEmptyCrosswordGrid(n: number): string[][] {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ""));
}

function canPlaceAcross(grid: string[][], word: string, row: number, col: number): boolean {
  const size = grid.length;
  if (row < 0 || row >= size || col < 0 || col + word.length > size) return false;
  for (let i = 0; i < word.length; i++) {
    const cell = grid[row]![col + i]!;
    if (cell !== "" && cell !== word[i]!) return false;
  }
  return true;
}

function canPlaceDown(grid: string[][], word: string, row: number, col: number): boolean {
  const size = grid.length;
  if (col < 0 || col >= size || row < 0 || row + word.length > size) return false;
  for (let i = 0; i < word.length; i++) {
    const cell = grid[row + i]![col]!;
    if (cell !== "" && cell !== word[i]!) return false;
  }
  return true;
}

function placeAcross(grid: string[][], word: string, row: number, col: number) {
  for (let i = 0; i < word.length; i++) grid[row]![col + i] = word[i]!;
}

function placeDown(grid: string[][], word: string, row: number, col: number) {
  for (let i = 0; i < word.length; i++) grid[row + i]![col] = word[i]!;
}

function tryIntersectPlace(grid: string[][], word: string, placed: CrosswordPlaced[]): CrosswordPlaced | null {
  for (const p of placed) {
    for (let i = 0; i < p.word.length; i++) {
      const pr = p.direction === "across" ? p.row : p.row + i;
      const pc = p.direction === "across" ? p.col + i : p.col;
      const letter = p.word[i]!;
      for (let j = 0; j < word.length; j++) {
        if (word[j] !== letter) continue;
        const acR = pr;
        const acC = pc - j;
        if (canPlaceAcross(grid, word, acR, acC)) {
          placeAcross(grid, word, acR, acC);
          return { word, row: acR, col: acC, direction: "across" };
        }
        const dnR = pr - j;
        const dnC = pc;
        if (canPlaceDown(grid, word, dnR, dnC)) {
          placeDown(grid, word, dnR, dnC);
          return { word, row: dnR, col: dnC, direction: "down" };
        }
      }
    }
  }
  return null;
}

function placeRandomAny(grid: string[][], word: string): CrosswordPlaced | null {
  const size = grid.length;
  for (let t = 0; t < 120; t++) {
    const horiz = Math.random() < 0.5;
    if (horiz) {
      const r = Math.floor(Math.random() * size);
      const maxC = size - word.length;
      if (maxC < 0) continue;
      const c = Math.floor(Math.random() * (maxC + 1));
      if (canPlaceAcross(grid, word, r, c)) {
        placeAcross(grid, word, r, c);
        return { word, row: r, col: c, direction: "across" };
      }
    } else {
      const c = Math.floor(Math.random() * size);
      const maxR = size - word.length;
      if (maxR < 0) continue;
      const r = Math.floor(Math.random() * (maxR + 1));
      if (canPlaceDown(grid, word, r, c)) {
        placeDown(grid, word, r, c);
        return { word, row: r, col: c, direction: "down" };
      }
    }
  }
  return null;
}

/** Last resort: first row run of empty cells that fits the word (before filler letters). */
function placeInEmptyRun(grid: string[][], word: string): CrosswordPlaced | null {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c + word.length <= size; c++) {
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        if (grid[r]![c + i] !== "") {
          ok = false;
          break;
        }
      }
      if (ok) {
        placeAcross(grid, word, r, c);
        return { word, row: r, col: c, direction: "across" };
      }
    }
  }
  return null;
}

function crosswordClueForWord(word: string): string {
  const u = String(word || "").toUpperCase().trim();
  if (CROSSWORD_CLUE_MAP[u]) return CROSSWORD_CLUE_MAP[u]!;
  const meaning = getBrainflexWordClue(u);
  if (meaning && meaning !== "Meaning not available") return meaning;
  return `A useful school word: ${u.charAt(0)}${u.slice(1).toLowerCase()}`;
}

function fitCrosswordBank(words: string[], minLen: number, maxLen: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of words) {
    const u = String(raw || "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    if (!u || seen.has(u)) continue;
    if (u.length < minLen || u.length > maxLen) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

/**
 * Crossword candidates:
 * - With Curriculum Focus → curriculum/topic words (same as today).
 * - Without Curriculum Focus → educational generic bank with local clues (no dictionary gate).
 * Always ensures enough words so the layout engine can build a printable puzzle.
 */
async function pickCrosswordCandidateWords(ctx?: BrainFlexContext): Promise<string[]> {
  const limits = getGradeWordLimits(getContextGradeBand(ctx));
  const minLen = limits.minLen;
  const maxLen = Math.min(8, limits.maxLen);
  const needed = Math.max(16, limits.crosswordMax * 3);

  const hasCurriculum =
    !isGenericBrainFlexSubject(ctx?.subject) || Boolean(ctx?.topic?.trim());

  let candidates: string[] = [];

  if (hasCurriculum) {
    candidates = (
      await pickBrainflexWordsForContext(needed, ctx, { minLen, maxLen })
    ).map((w) => w.toUpperCase());
  }

  // No curriculum (or sparse curriculum pool): use crossword-local educational bank.
  if (candidates.length < Math.min(8, limits.crosswordMax + 2)) {
    const generic = fitCrosswordBank(
      shuffle([...CROSSWORD_GENERIC_BANK]),
      minLen,
      maxLen,
    );
    const merged = new Set([...candidates, ...generic]);
    // Grade/board-aware educational extras when focus is blank.
    const gradeHint = String(ctx?.grade || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (gradeHint.includes("GRADE") || /\d/.test(String(ctx?.grade || ""))) {
      for (const w of fitCrosswordBank(["GRADE", "CLASS", "SCHOOL", "LEARN", "BOOK"], minLen, maxLen)) {
        merged.add(w);
      }
    }
    candidates = [...merged];
  }

  if (candidates.length === 0) {
    candidates = fitCrosswordBank(Object.keys(CROSSWORD_CLUE_MAP), 3, 8);
  }

  return shuffle(candidates).slice(0, Math.max(needed, candidates.length));
}

/**
 * Full crossword: intersecting layout + clues.
 * Works with or without Curriculum Focus (Brain-Flex only).
 */
export async function generateCrossword(ctx?: BrainFlexContext): Promise<CrosswordPayload> {
  const clueForWord = crosswordClueForWord;

  const limits = getGradeWordLimits(getContextGradeBand(ctx));
  const candidateWords = await pickCrosswordCandidateWords(ctx);

  const built = generateCrosswordEngine({
    candidateWords,
    clueForWord,
    maxPlacedWords: limits.crosswordMax,
    minIntersectionsPerWord: 1,
    maxRetries: 10 + Math.floor(Math.random() * 6),
  });

  const placed = (built.answers ?? []).map((a) => ({
    word: a.word,
    row: a.row,
    col: a.col,
    direction: a.direction,
    number: built.clueNumbersGrid?.[a.row]?.[a.col] ?? 0,
    clue: clueForWord(a.word),
  })) as CrosswordPlaced[];

  const clueEntries: CrosswordClueEntry[] = [...(built.across ?? []), ...(built.down ?? [])].map((c, i) => ({
    number: c.number || i + 1,
    clue: c.clue,
    answer: c.answer,
  }));

  const payload: CrosswordPayload = {
    grid: built.grid,
    words: built.wordBank,
    wordsDetailed: built.wordBank.map((w) => ({ word: w, meaning: crosswordClueForWord(w) })),
    clues: clueEntries,
    crosswordAnswers: built.wordBank,
    answers: placed,

    across: built.across,
    down: built.down,
    wordBank: built.wordBank,
    clueNumbersGrid: built.clueNumbersGrid,
    placedWords: placed,
  };
  console.log("CROSSWORD DATA:", payload);
  return payload;
}

export async function generateWordSearch(ctx?: BrainFlexContext): Promise<{
  size: number;
  grid: string[][];
  words: string[];
  clues: string[];
  wordsDetailed?: Array<{ word: string; meaning: string }>;
  answers?: Array<{ word: string; row: number; col: number; direction: string; positions: Array<{ row: number; col: number }> }>;
}> {
  const limits = getGradeWordLimits(getContextGradeBand(ctx));
  const TARGET_WORD_COUNT = 6;

  // Student-friendly directions ONLY:
  // - left → right
  // - top → bottom
  const directions: Array<{ dr: number; dc: number; label: string }> = [
    { dr: 0, dc: 1, label: "right" },
    { dr: 1, dc: 0, label: "down" },
  ];

  const randLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

  const wordExistsInGrid = (grid: string[][], rawWord: string): boolean => {
    const word = rawWord.toUpperCase().replace(/\s+/g, "");
    if (!word) return false;
    const rows = grid.length;
    const cols = rows > 0 ? grid[0]!.length : 0;
    const inBounds = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < cols;

    for (let r0 = 0; r0 < rows; r0++) {
      for (let c0 = 0; c0 < cols; c0++) {
        for (const dir of directions) {
          let ok = true;
          for (let i = 0; i < word.length; i++) {
            const r = r0 + dir.dr * i;
            const c = c0 + dir.dc * i;
            if (!inBounds(r, c) || grid[r]![c] !== word[i]) {
              ok = false;
              break;
            }
          }
          if (ok) return true;
        }
      }
    }
    return false;
  };

  const buildEmptyGrid = (size: number) =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => ""));

  const canPlaceAt = (grid: string[][], word: string, r0: number, c0: number, dr: number, dc: number) => {
    const size = grid.length;
    const inBounds = (r: number, c: number) => r >= 0 && c >= 0 && r < size && c < size;
    for (let i = 0; i < word.length; i++) {
      const r = r0 + dr * i;
      const c = c0 + dc * i;
      if (!inBounds(r, c)) return false;
      const existing = grid[r]![c]!;
      const next = word[i]!;
      // Allow overlap only if same letter.
      if (existing && existing !== next) return false;
    }
    return true;
  };

  const placeWord = (
    grid: string[][],
    word: string,
  ): { ok: true; row: number; col: number; direction: string; positions: Array<{ row: number; col: number }> } | { ok: false } => {
    const size = grid.length;

    for (let attempt = 0; attempt < 100; attempt++) {
      const dir = directions[Math.floor(Math.random() * directions.length)]!;

      // Compute valid start range so end stays in-bounds.
      const maxR = dir.dr === 1 ? size - word.length : dir.dr === -1 ? size - 1 : size - 1;
      const minR = dir.dr === -1 ? word.length - 1 : 0;
      const maxC = dir.dc === 1 ? size - word.length : dir.dc === -1 ? size - 1 : size - 1;
      const minC = dir.dc === -1 ? word.length - 1 : 0;

      const r0 = minR + Math.floor(Math.random() * (maxR - minR + 1));
      const c0 = minC + Math.floor(Math.random() * (maxC - minC + 1));

      if (!canPlaceAt(grid, word, r0, c0, dir.dr, dir.dc)) continue;

      const positions: Array<{ row: number; col: number }> = [];
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dir.dr * i;
        const c = c0 + dir.dc * i;
        grid[r]![c] = word[i]!;
        positions.push({ row: r, col: c });
      }
      return { ok: true, row: r0, col: c0, direction: dir.label, positions };
    }

    return { ok: false };
  };

  // Try multiple full regenerations to guarantee correctness and variety.
  const attemptOffset = (ctx?.generationAttempt ?? 0) * 7;
  for (let generationAttempt = 0; generationAttempt < 50; generationAttempt++) {
    const size = 12;
    let selectedWords = await pickBrainflexWordsForContext(TARGET_WORD_COUNT * 3, ctx, {
      minLen: limits.minLen,
      maxLen: Math.min(size, limits.maxLen),
    });
    if (selectedWords.length < TARGET_WORD_COUNT) {
      selectedWords = await pickBrainflexWordsForContext(TARGET_WORD_COUNT * 5, ctx, {
        minLen: limits.minLen,
        maxLen: Math.min(size, limits.maxLen),
      });
    }
    const candidates = shuffle(selectedWords)
      .map((w) => w.toUpperCase().replace(/\s+/g, ""))
      .filter((w) => w.length >= 4 && w.length <= size);

    // Rotate candidate order each regeneration attempt for different placement patterns.
    const rotated =
      candidates.length > 0
        ? [...candidates.slice((generationAttempt + attemptOffset) % candidates.length), ...candidates]
        : candidates;

    const grid = buildEmptyGrid(size);
    const placedWords: string[] = [];
    const answers: Array<{ word: string; row: number; col: number; direction: string; positions: Array<{ row: number; col: number }> }> = [];

    for (const w of rotated) {
      if (placedWords.length >= TARGET_WORD_COUNT) break;
      if (placedWords.includes(w)) continue;
      const placed = placeWord(grid, w);
      if (placed.ok) {
        placedWords.push(w);
        answers.push({ word: w, row: placed.row, col: placed.col, direction: placed.direction, positions: placed.positions });
      }
    }

    // If we couldn't place enough words, try a full regeneration.
    if (placedWords.length < TARGET_WORD_COUNT) continue;

    // Fill empty cells only AFTER placements succeed.
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r]![c]) grid[r]![c] = randLetter();
      }
    }

    // Final validation: every listed word must exist in grid.
    const finalWords = placedWords.filter((w) => wordExistsInGrid(grid, w));
    if (finalWords.length !== TARGET_WORD_COUNT) {
      continue;
    }

    return {
      size,
      grid,
      words: finalWords,
      // Always meaningful educational clues (never placeholders / "Meaning not available").
      clues: finalWords.map((w) => getWordSearchDisplayClue(w)),
      wordsDetailed: finalWords.map((w) => ({ word: w, meaning: getWordSearchDisplayClue(w) })),
      answers,
    };
  }

  // Fallback: never lie—return only what we can prove exists.
  const size = 12;
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => randLetter()));
  return { size, grid, words: [], clues: [], wordsDetailed: [], answers: [] };
}

export async function generateRiddles(ctx?: BrainFlexContext): Promise<Array<{ question: string; answer: string }>> {
  return pickRiddles(ctx, 3);
}

export async function generateBrainTeasers(ctx?: BrainFlexContext): Promise<Array<{ question: string; answer: string }>> {
  return pickBrainTeasers(ctx, 3);
}

export function generateSudoku() {
  const payload = generateSudoku6x6();
  if (!isSudoku6x6Matrix(payload.grid) || !isSudoku6x6Matrix(payload.solution)) {
    throw new Error("Sudoku generator produced invalid 6×6 data");
  }
  return payload;
}

function scrambleWord(word: string): string {
  const letters = word.split("");
  let scrambled = shuffle(letters).join("");
  let guard = 0;
  while (scrambled === word && letters.length > 1 && guard++ < 12) {
    scrambled = shuffle(letters).join("");
  }
  return scrambled;
}

export async function generateBoggles(ctx?: BrainFlexContext): Promise<Array<{ scrambled: string; original: string; answer: string; hint: string; meaning?: string }>> {
  const limits = getGradeWordLimits(getContextGradeBand(ctx));
  const selected = await pickBrainflexWordsForContext(5, ctx, {
    minLen: limits.minLen,
    maxLen: limits.maxLen,
  });
  const seed = (ctx?.generationSeed ?? Date.now()) + (ctx?.generationAttempt ?? 0) * 809;
  const ordered = seededShuffle(selected, seed);
  return ordered.map((word) => {
    const original = word.toUpperCase();
    const scrambled = scrambleWord(original);
    return { scrambled, original, answer: original, hint: "Unscramble", meaning: getBrainflexWordClue(original) };
  });
}

/** Returns payload for one normalized puzzle type (data only). */
export async function generatePuzzle(normalizedType: string, ctx?: BrainFlexContext): Promise<unknown | null> {
  switch (normalizedType) {
    case "word_search":
      return generateWordSearch(ctx);
    case "riddles":
      return generateRiddles(ctx);
    case "brain_teasers":
      return generateBrainTeasers(ctx);
    case "sudoku":
      return generateSudoku();
    case "boggles":
      return generateBoggles(ctx);
    case "crossword":
      return generateCrossword(ctx);
    default:
      return null;
  }
}

function isEmptyPayload(type: string, data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (type === "word_search") return !Array.isArray(o.grid) || !Array.isArray(o.words);
    if (type === "sudoku") return !isSudoku6x6Matrix(o.grid);
    if (type === "crossword") {
      if (!Array.isArray(o.grid) || o.grid.length === 0) return true;
      if (!Array.isArray(o.clues) || o.clues.length === 0) return true;
      const row0 = o.grid[0];
      if (!Array.isArray(row0) || row0.length === 0) return true;
      const wordsOk = Array.isArray(o.words) && o.words.length > 0;
      const answersOk = Array.isArray(o.answers) && o.answers.length > 0;
      if (!wordsOk && !answersOk) return true;
      return false;
    }
  }
  return false;
}

export type BrainFlexSection = { type: string; data: unknown };

/**
 * Build worksheet JSON: sections in puzzle order, plus top-level `crossword` when that type is selected.
 * Crossword is generated inline so it always appears and is never dropped by layout failures.
 */
export async function brainFlexContentFromSelection(puzzleTypeIds: string[], ctx?: BrainFlexContext) {
  const sections: BrainFlexSection[] = [];
  let crossword: CrosswordPayload | undefined;

  for (const raw of puzzleTypeIds) {
    const n = normalizeBrainFlexTypeId(raw);
    if (!n) {
      console.warn("[BrainFlexPuzzle] unknown puzzle type id:", raw);
      continue;
    }
    if (n === "crossword") {
      crossword = await generateCrossword(ctx);
      console.log("CROSSWORD DATA:", crossword);
      sections.push({ type: "crossword", data: crossword });
      continue;
    }
    const data = await generatePuzzle(n, ctx);
    if (isEmptyPayload(n, data)) {
      console.warn("[BrainFlexPuzzle] empty data for type:", n, raw);
      continue;
    }
    sections.push({ type: n, data });
  }

  return {
    title: "Brain Flex",
    theme: "fun learning",
    graphicEmojis: ["🧠", "🎯", "⭐"],
    sections,
    crossword,
  };
}

/** Collect uppercase words from generated sections for de-duplication across runs. */
export function extractBrainFlexUsedWords(content: {
  sections?: BrainFlexSection[];
  crossword?: CrosswordPayload;
}): string[] {
  const out = new Set<string>();
  const add = (w: unknown) => {
    const u = String(w || "").toUpperCase().trim();
    if (/^[A-Z]{3,}$/.test(u)) out.add(u);
  };

  for (const section of content.sections ?? []) {
    const data = section.data as Record<string, unknown> | unknown[] | null;
    if (!data) continue;
    if (section.type === "word_search" && typeof data === "object" && !Array.isArray(data)) {
      for (const w of (data as { words?: string[] }).words ?? []) add(w);
    }
    if (section.type === "crossword" && typeof data === "object" && !Array.isArray(data)) {
      const c = data as CrosswordPayload;
      for (const w of c.crosswordAnswers ?? c.words ?? []) add(w);
    }
    if (section.type === "boggles" && Array.isArray(data)) {
      for (const item of data as Array<{ original?: string; answer?: string }>) {
        add(item.original ?? item.answer);
      }
    }
  }

  if (content.crossword) {
    for (const w of content.crossword.crosswordAnswers ?? content.crossword.words ?? []) add(w);
  }

  return [...out];
}

function normQuestion(q: string): string {
  return String(q || "").toLowerCase().trim().replace(/\s+/g, " ");
}

/** Collect riddle questions from generated sections for de-duplication. */
export function extractBrainFlexUsedRiddles(content: {
  sections?: BrainFlexSection[];
}): string[] {
  const out: string[] = [];
  for (const section of content.sections ?? []) {
    if (section.type !== "riddles" || !Array.isArray(section.data)) continue;
    for (const item of section.data as Array<{ question?: string }>) {
      const q = normQuestion(String(item.question || ""));
      if (q) out.push(q);
    }
  }
  return out;
}

/** Collect brain teaser questions from generated sections for de-duplication. */
export function extractBrainFlexUsedBrainTeasers(content: {
  sections?: BrainFlexSection[];
}): string[] {
  const out: string[] = [];
  for (const section of content.sections ?? []) {
    if (section.type !== "brain_teasers" || !Array.isArray(section.data)) continue;
    for (const item of section.data as Array<{ question?: string }>) {
      const q = normQuestion(String(item.question || ""));
      if (q) out.push(q);
    }
  }
  return out;
}
