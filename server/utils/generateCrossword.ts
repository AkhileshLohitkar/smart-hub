export type CrosswordDirection = "across" | "down";

export type CrosswordPlacement = {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
  number: number;
};

export type CrosswordAnswer = {
  word: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
};

export type CrosswordClueEntry = { number: number; clue: string; answer: string };

export type GenerateCrosswordResult = {
  grid: string[][];
  placements: CrosswordPlacement[];
  across: CrosswordClueEntry[];
  down: CrosswordClueEntry[];
  clueNumbersGrid: Array<Array<number | null>>;
  wordBank: string[];
  answers: CrosswordAnswer[];
};

function normalizeWord(raw: string) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

type CellKey = `${number}:${number}`;
type Cell = { letter: string };
const keyOf = (r: number, c: number) => `${r}:${c}` as const;

function computeBounds(cells: Map<CellKey, Cell>) {
  let minR = Infinity,
    minC = Infinity,
    maxR = -Infinity,
    maxC = -Infinity;
  for (const k of cells.keys()) {
    const [rs, cs] = k.split(":");
    const r = Number(rs);
    const c = Number(cs);
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  }
  return { minR, minC, maxR, maxC };
}

function toDerivedGrid(cells: Map<CellKey, Cell>) {
  if (cells.size === 0) return { grid: [["#"]], offsetRow: 0, offsetCol: 0 };
  const { minR, minC, maxR, maxC } = computeBounds(cells);
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const grid: string[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "#"));
  for (const [k, v] of cells.entries()) {
    const [rs, cs] = k.split(":");
    const r = Number(rs);
    const c = Number(cs);
    grid[r - minR]![c - minC] = v.letter;
  }
  return { grid, offsetRow: minR, offsetCol: minC };
}

function computeClueNumbersFromCells(cells: Map<CellKey, Cell>) {
  if (cells.size === 0) return { clueNumbersGrid: [[null]], offsetRow: 0, offsetCol: 0 };
  const { minR, minC, maxR, maxC } = computeBounds(cells);
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const nums: Array<Array<number | null>> = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

  const has = (r: number, c: number) => cells.has(keyOf(r, c));
  let n = 1;
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (!has(r, c)) continue;
      const startsAcross = !has(r, c - 1) && has(r, c + 1);
      const startsDown = !has(r - 1, c) && has(r + 1, c);
      if (startsAcross || startsDown) nums[r - minR]![c - minC] = n++;
    }
  }
  return { clueNumbersGrid: nums, offsetRow: minR, offsetCol: minC };
}

function buildLetterIndexFromCells(cells: Map<CellKey, Cell>) {
  const index = new Map<string, Array<{ r: number; c: number }>>();
  for (const [k, v] of cells.entries()) {
    const [rs, cs] = k.split(":");
    const r = Number(rs);
    const c = Number(cs);
    const list = index.get(v.letter) ?? [];
    list.push({ r, c });
    index.set(v.letter, list);
  }
  return index;
}

function canPlaceWordOnCells(
  cells: Map<CellKey, Cell>,
  wordRaw: string,
  row: number,
  col: number,
  direction: CrosswordDirection,
  opts: { requireIntersection: boolean },
): { ok: boolean; intersections: number } {
  const w = normalizeWord(wordRaw);
  if (!w) return { ok: false, intersections: 0 };
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;

  const has = (r: number, c: number) => cells.has(keyOf(r, c));
  const at = (r: number, c: number) => cells.get(keyOf(r, c))?.letter;

  // Must not attach to existing word before or after
  if (has(row - dr, col - dc)) return { ok: false, intersections: 0 };
  if (has(row + dr * w.length, col + dc * w.length)) return { ok: false, intersections: 0 };

  let intersections = 0;
  for (let i = 0; i < w.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const existing = at(r, c);
    const ch = w[i]!;

    if (existing && existing !== ch) return { ok: false, intersections: 0 };
    const isIntersectionCell = existing === ch;
    if (isIntersectionCell) intersections++;

    // No illegal side-touching unless this cell is an intersection.
    if (!isIntersectionCell) {
      if (direction === "across") {
        if (has(r - 1, c) || has(r + 1, c)) return { ok: false, intersections: 0 };
      } else {
        if (has(r, c - 1) || has(r, c + 1)) return { ok: false, intersections: 0 };
      }
    }
  }

  if (opts.requireIntersection && intersections < 1) return { ok: false, intersections: 0 };
  return { ok: true, intersections };
}

function placeWordOnCells(
  cells: Map<CellKey, Cell>,
  wordRaw: string,
  row: number,
  col: number,
  direction: CrosswordDirection,
) {
  const w = normalizeWord(wordRaw);
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;
  for (let i = 0; i < w.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    cells.set(keyOf(r, c), { letter: w[i]! });
  }
}

export function generateCrosswordEngine(args: {
  candidateWords: string[];
  clueForWord: (word: string) => string;
  maxPlacedWords?: number;
  maxAttemptsPerWord?: number;
  minIntersectionsPerWord?: number;
  maxRetries?: number;
}): GenerateCrosswordResult {
  const maxPlaced = args.maxPlacedWords ?? 8;
  const maxAttemptsPerWord = args.maxAttemptsPerWord ?? 250;
  const maxRetries = args.maxRetries ?? 6;

  const candidates = [...new Set(args.candidateWords.map(normalizeWord))].filter(Boolean);
  if (candidates.length === 0) {
    return { grid: [["#"]], placements: [], across: [], down: [], clueNumbersGrid: [[null]], wordBank: [], answers: [] };
  }

  const shuffleCandidates = (list: string[]) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy.sort((a, b) => b.length - a.length || a.localeCompare(b));
  };

  for (let retry = 0; retry < maxRetries; retry++) {
    const cells = new Map<CellKey, Cell>();
    const placements: Array<{ word: string; row: number; col: number; direction: CrosswordDirection }> = [];

    const words = shuffleCandidates(candidates);
    const firstCandidates = words.slice(0, Math.min(4, words.length));
    const first = firstCandidates[Math.floor(Math.random() * firstCandidates.length)] ?? words[0]!;
    const firstDir: CrosswordDirection = Math.random() < 0.5 ? "across" : "down";
    placeWordOnCells(cells, first, 0, 0, firstDir);
    placements.push({ word: first, row: 0, col: 0, direction: firstDir });

    let placedCount = 1;

    for (const word of words.slice(1)) {
      if (placedCount >= maxPlaced) break;

      const letterIndex = buildLetterIndexFromCells(cells);
      let best:
        | { row: number; col: number; dir: CrosswordDirection; intersections: number }
        | null = null;

      // Try intersections first.
      for (let wi = 0; wi < word.length; wi++) {
        const ch = word[wi]!;
        const hits = letterIndex.get(ch) ?? [];
        for (const hit of hits) {
          // Option A: place across intersecting at hit
          const acrossRow = hit.r;
          const acrossCol = hit.c - wi;
          const a = canPlaceWordOnCells(cells, word, acrossRow, acrossCol, "across", { requireIntersection: true });
          if (a.ok) {
            if (!best || a.intersections > best.intersections) {
              best = { row: acrossRow, col: acrossCol, dir: "across", intersections: a.intersections };
            }
          }

          // Option B: place down intersecting at hit
          const downRow = hit.r - wi;
          const downCol = hit.c;
          const d = canPlaceWordOnCells(cells, word, downRow, downCol, "down", { requireIntersection: true });
          if (d.ok) {
            if (!best || d.intersections > best.intersections) {
              best = { row: downRow, col: downCol, dir: "down", intersections: d.intersections };
            }
          }
        }
      }

      if (best) {
        placeWordOnCells(cells, word, best.row, best.col, best.dir);
        placements.push({ word, row: best.row, col: best.col, direction: best.dir });
        placedCount++;
        continue;
      }

      // As fallback: try a limited number of random placements (still validated).
      let placed = false;
      for (let t = 0; t < maxAttemptsPerWord && !placed; t++) {
        const dir: CrosswordDirection = Math.random() < 0.5 ? "across" : "down";
        const r = Math.floor(Math.random() * 15) - 7;
        const c = Math.floor(Math.random() * 15) - 7;
        const ok = canPlaceWordOnCells(cells, word, r, c, dir, { requireIntersection: true });
        if (ok.ok) {
          placeWordOnCells(cells, word, r, c, dir);
          placements.push({ word, row: r, col: c, direction: dir });
          placedCount++;
          placed = true;
        }
      }
    }

    // Derive a minimal grid only for storage/compat, but the engine itself is coordinate-based.
    const { grid, offsetRow, offsetCol } = toDerivedGrid(cells);
    const { clueNumbersGrid, offsetRow: offR, offsetCol: offC } = computeClueNumbersFromCells(cells);

    // Convert placements to derived-grid coordinates and build clue lists.
    const answers: CrosswordAnswer[] = placements.map((p) => ({
      word: p.word,
      row: p.row - offR,
      col: p.col - offC,
      direction: p.direction,
    }));
    const wordBank = Array.from(new Set(placements.map((p) => p.word))).sort((a, b) => a.localeCompare(b));

    const placementsWithNumbers: CrosswordPlacement[] = placements.map((p) => {
      const number = clueNumbersGrid[p.row - offR]?.[p.col - offC] ?? 0;
      return {
        word: p.word,
        clue: args.clueForWord(p.word),
        row: p.row - offR,
        col: p.col - offC,
        direction: p.direction,
        number: typeof number === "number" ? number : 0,
      };
    });

    const across: CrosswordClueEntry[] = [];
    const down: CrosswordClueEntry[] = [];
    for (const pl of placementsWithNumbers) {
      const entry = { number: pl.number, clue: pl.clue, answer: pl.word };
      if (pl.direction === "across") across.push(entry);
      else down.push(entry);
    }
    across.sort((a, b) => a.number - b.number);
    down.sort((a, b) => a.number - b.number);

    // Success criteria: must have both clue sets and enough placed words.
    if (wordBank.length >= Math.min(5, maxPlaced) && across.length > 0 && down.length > 0) {
      return {
        grid,
        placements: placementsWithNumbers,
        across,
        down,
        clueNumbersGrid,
        wordBank,
        answers,
      };
    }

    // Soft accept: at least 2 intersecting words (across + down) if maxPlaced is tiny.
    if (wordBank.length >= 2 && across.length > 0 && down.length > 0) {
      return {
        grid,
        placements: placementsWithNumbers,
        across,
        down,
        clueNumbersGrid,
        wordBank,
        answers,
      };
    }
  }

  // Guaranteed educational fallback — never return an empty "#" grid.
  return buildGuaranteedCrosswordFallback(candidates, args.clueForWord, maxPlaced);
}

function buildGuaranteedCrosswordFallback(
  candidates: string[],
  clueForWord: (word: string) => string,
  maxPlaced: number,
): GenerateCrosswordResult {
  const words = [...new Set(candidates.map(normalizeWord))].filter((w) => w.length >= 3);
  if (words.length === 0) {
    words.push("LEARN", "BRAIN", "FOCUS", "SOLVE", "GRID");
  }

  // Prefer a longer seed for easier intersections.
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const seed = sorted[0]!;

  let bestAcross = seed;
  let bestDown: string | null = null;
  let bestSeedIdx = 0;
  let bestOtherIdx = 0;

  outer: for (const acrossWord of sorted) {
    for (let si = 0; si < acrossWord.length; si++) {
      const letter = acrossWord[si]!;
      for (const downWord of sorted) {
        if (downWord === acrossWord) continue;
        const di = downWord.indexOf(letter);
        if (di < 0) continue;
        bestAcross = acrossWord;
        bestDown = downWord;
        bestSeedIdx = si;
        bestOtherIdx = di;
        break outer;
      }
    }
  }

  if (!bestDown) {
    // Force a simple 2-word cross using shared letter "A" or first letters.
    bestAcross = "LEARN";
    bestDown = "LOGIC";
    bestSeedIdx = 0; // L
    bestOtherIdx = 0; // L
  }

  const cells = new Map<CellKey, Cell>();
  placeWordOnCells(cells, bestAcross, 0, 0, "across");
  const downRow = 0 - bestOtherIdx;
  const downCol = bestSeedIdx;
  placeWordOnCells(cells, bestDown, downRow, downCol, "down");

  const placements: Array<{ word: string; row: number; col: number; direction: CrosswordDirection }> = [
    { word: bestAcross, row: 0, col: 0, direction: "across" },
    { word: bestDown, row: downRow, col: downCol, direction: "down" },
  ];

  // Add more intersecting words when possible.
  const used = new Set([bestAcross, bestDown]);
  for (const word of sorted) {
    if (placements.length >= Math.max(2, Math.min(5, maxPlaced))) break;
    if (used.has(word)) continue;
    const letterIndex = buildLetterIndexFromCells(cells);
    let best:
      | { row: number; col: number; dir: CrosswordDirection; intersections: number }
      | null = null;
    for (let wi = 0; wi < word.length; wi++) {
      const ch = word[wi]!;
      const hits = letterIndex.get(ch) ?? [];
      for (const hit of hits) {
        const acrossRow = hit.r;
        const acrossCol = hit.c - wi;
        const a = canPlaceWordOnCells(cells, word, acrossRow, acrossCol, "across", { requireIntersection: true });
        if (a.ok && (!best || a.intersections > best.intersections)) {
          best = { row: acrossRow, col: acrossCol, dir: "across", intersections: a.intersections };
        }
        const downR = hit.r - wi;
        const downC = hit.c;
        const d = canPlaceWordOnCells(cells, word, downR, downC, "down", { requireIntersection: true });
        if (d.ok && (!best || d.intersections > best.intersections)) {
          best = { row: downR, col: downC, dir: "down", intersections: d.intersections };
        }
      }
    }
    if (best) {
      placeWordOnCells(cells, word, best.row, best.col, best.dir);
      placements.push({ word, row: best.row, col: best.col, direction: best.dir });
      used.add(word);
    }
  }

  const { grid, offsetRow: offR, offsetCol: offC } = toDerivedGrid(cells);
  const { clueNumbersGrid } = computeClueNumbersFromCells(cells);
  const answers: CrosswordAnswer[] = placements.map((p) => ({
    word: p.word,
    row: p.row - offR,
    col: p.col - offC,
    direction: p.direction,
  }));
  const wordBank = Array.from(new Set(placements.map((p) => p.word))).sort((a, b) => a.localeCompare(b));
  const placementsWithNumbers: CrosswordPlacement[] = placements.map((p) => {
    const number = clueNumbersGrid[p.row - offR]?.[p.col - offC] ?? 0;
    return {
      word: p.word,
      clue: clueForWord(p.word),
      row: p.row - offR,
      col: p.col - offC,
      direction: p.direction,
      number: typeof number === "number" ? number : 0,
    };
  });
  const across: CrosswordClueEntry[] = [];
  const down: CrosswordClueEntry[] = [];
  for (const pl of placementsWithNumbers) {
    const entry = { number: pl.number, clue: pl.clue, answer: pl.word };
    if (pl.direction === "across") across.push(entry);
    else down.push(entry);
  }
  across.sort((a, b) => a.number - b.number);
  down.sort((a, b) => a.number - b.number);

  return {
    grid,
    placements: placementsWithNumbers,
    across,
    down,
    clueNumbersGrid,
    wordBank,
    answers,
  };
}

