import { pickBrainflexWords } from "./utils/brainflexWords";
import { getWordMeaning } from "./utils/wordMeanings";
import { generateCrosswordEngine } from "./utils/generateCrossword";
import { generateSudoku6x6, isSudoku6x6Matrix } from "@shared/sudoku6x6";

/**
 * Brain-Flex puzzle generation only (isolated from normal worksheet AI flow).
 * Stored shape: { title, theme?, graphicEmojis?, sections: { type, data }[] }
 */

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

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

const CROSSWORD_WORD_POOL = [
  "MATH",
  "LOGIC",
  "BRAIN",
  "PUZZLE",
  "THINK",
  "FOCUS",
  "LEARN",
  "SMART",
  "NUMBER",
  "CODE",
  "GRID",
  "SOLVE",
];

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
};

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

/**
 * Full crossword: 10×10, intersecting / random placement, filler letters in empty cells.
 * Always returns non-empty grid + clues (Brain-Flex only — not wired to /api/worksheets/*).
 */
export function generateCrossword(): CrosswordPayload {
  const clueForWord = (w: string) => CROSSWORD_CLUE_MAP[String(w || "").toUpperCase()] ?? getWordMeaning(w);

  // Strong engine: intersection-first placement + collision checks + numbering + across/down extraction.
  const candidateWords = pickBrainflexWords(18, { minLen: 4, maxLen: 8 }).map((w) => w.toUpperCase());
  const built = generateCrosswordEngine({
    candidateWords,
    clueForWord,
    maxPlacedWords: 8,
    minIntersectionsPerWord: 1,
    maxRetries: 8,
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
    wordsDetailed: built.wordBank.map((w) => ({ word: w, meaning: getWordMeaning(w) })),
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

export function generateWordSearch(): {
  size: number;
  grid: string[][];
  words: string[];
  clues: string[];
  wordsDetailed?: Array<{ word: string; meaning: string }>;
  answers?: Array<{ word: string; row: number; col: number; direction: string; positions: Array<{ row: number; col: number }> }>;
} {
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

  // Try multiple full regenerations to guarantee correctness.
  for (let generationAttempt = 0; generationAttempt < 40; generationAttempt++) {
    // Pick meaningful words only (from bank), but ensure they fit in the chosen grid.
    // Use a grid size large enough for typical words while keeping PDF readable.
    const size = 12;
    let selectedWords = pickBrainflexWords(TARGET_WORD_COUNT * 2, { minLen: 4, maxLen: size });
    if (selectedWords.length < TARGET_WORD_COUNT) {
      selectedWords = pickBrainflexWords(TARGET_WORD_COUNT * 3, { minLen: 4, maxLen: size });
    }
    const candidates = shuffle(selectedWords)
      .map((w) => w.toUpperCase().replace(/\s+/g, ""))
      .filter((w) => w.length >= 4 && w.length <= size);

    const grid = buildEmptyGrid(size);
    const placedWords: string[] = [];
    const answers: Array<{ word: string; row: number; col: number; direction: string; positions: Array<{ row: number; col: number }> }> = [];

    for (const w of candidates) {
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
      clues: finalWords.map((w) => getWordMeaning(w)),
      wordsDetailed: finalWords.map((w) => ({ word: w, meaning: getWordMeaning(w) })),
      answers,
    };
  }

  // Fallback: never lie—return only what we can prove exists.
  const size = 12;
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => randLetter()));
  return { size, grid, words: [], clues: [], wordsDetailed: [], answers: [] };
}

export function generateRiddles(): Array<{ question: string; answer: string }> {
  const riddles = [
    { question: "What has keys but can't open locks?", answer: "Keyboard" },
    { question: "What has a neck but no head?", answer: "Bottle" },
    { question: "What gets wetter as it dries?", answer: "Towel" },
    { question: "What has hands but cannot clap?", answer: "Clock" },
    { question: "What runs but never walks?", answer: "Water" },
    { question: "What has an eye but cannot see?", answer: "Needle" },
    { question: "What can travel around the world while staying in a corner?", answer: "A stamp" },
    { question: "What has to be broken before you can use it?", answer: "An egg" },
    { question: "The more you take, the more you leave behind. What are they?", answer: "Footsteps" },
    { question: "What begins with T, ends with T, and has T in it?", answer: "A teapot" },
  ];
  return shuffle(riddles).slice(0, 3);
}

export function generateBrainTeasers(): Array<{ question: string; answer: string }> {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const c = 1 + Math.floor(Math.random() * 9);
  const teasers = [
    { question: "If 3 cats catch 3 mice in 3 minutes, how many for 100 mice?", answer: "3 cats" },
    { question: "What comes next: 2, 4, 8, 16?", answer: "32" },
    { question: "I speak without a mouth. What am I?", answer: "Echo" },
    { question: "What has one eye but cannot see?", answer: "Needle" },
    { question: "2 cats catch 2 mice in 2 min, how many for 10 mice in 10 min?", answer: "2 cats" },
    { question: "1, 3, 6, 10, ?", answer: "15" },
    { question: "A farmer has 17 sheep; all but 9 run away. How many left?", answer: "9" },
    { question: `What is ${a} * ${b} + ${c}?`, answer: String(a * b + c) },
  ];
  return shuffle(teasers).slice(0, 3);
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

export function generateBoggles(): Array<{ scrambled: string; original: string; answer: string; hint: string; meaning?: string }> {
  // Only real words with meanings.
  const selected = pickBrainflexWords(5, { minLen: 4, maxLen: 12 });
  return selected.map((word) => {
    const original = word.toUpperCase();
    const scrambled = scrambleWord(original);
    return { scrambled, original, answer: original, hint: "Unscramble", meaning: getWordMeaning(original) };
  });
}

/** Returns payload for one normalized puzzle type (data only). */
export function generatePuzzle(normalizedType: string): unknown | null {
  switch (normalizedType) {
    case "word_search":
      return generateWordSearch();
    case "riddles":
      return generateRiddles();
    case "brain_teasers":
      return generateBrainTeasers();
    case "sudoku":
      return generateSudoku();
    case "boggles":
      return generateBoggles();
    case "crossword":
      return generateCrossword();
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
export function brainFlexContentFromSelection(puzzleTypeIds: string[]) {
  const sections: BrainFlexSection[] = [];
  let crossword: CrosswordPayload | undefined;

  for (const raw of puzzleTypeIds) {
    const n = normalizeBrainFlexTypeId(raw);
    if (!n) {
      console.warn("[BrainFlexPuzzle] unknown puzzle type id:", raw);
      continue;
    }
    if (n === "crossword") {
      crossword = generateCrossword();
      console.log("CROSSWORD DATA:", crossword);
      sections.push({ type: "crossword", data: crossword });
      continue;
    }
    const data = generatePuzzle(n);
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
