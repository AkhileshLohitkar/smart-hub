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

  for (let retry = 0; retry < maxRetries; retry++) {
    const cells = new Map<CellKey, Cell>();
    const placements: Array<{ word: string; row: number; col: number; direction: CrosswordDirection }> = [];

    // Prefer longer words first for better intersections.
    const words = [...candidates].sort((a, b) => b.length - a.length);

    const first = words[0]!;
    placeWordOnCells(cells, first, 0, 0, "across");
    placements.push({ word: first, row: 0, col: 0, direction: "across" });

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
  }

  // Final fallback: return minimal valid structure.
  return { grid: [["#"]], placements: [], across: [], down: [], clueNumbersGrid: [[null]], wordBank: [], answers: [] };
}

