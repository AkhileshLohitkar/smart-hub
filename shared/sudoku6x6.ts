/**
 * Brain-Flex 6×6 Sudoku (2×3 boxes). Single source of truth for generation + validation.
 */

export const SUDOKU_SIZE = 6;
export const SUDOKU_BOX_H = 2;
export const SUDOKU_BOX_W = 3;
export const SUDOKU_DIGITS = [1, 2, 3, 4, 5, 6] as const;

export type SudokuCell = number | null;
export type SudokuGrid = SudokuCell[][];
export type SudokuSolution = number[][];

export type SudokuPayload = {
  grid: SudokuGrid;
  solution: SudokuSolution;
  size: typeof SUDOKU_SIZE;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function boxStart(r: number, c: number) {
  return {
    br: Math.floor(r / SUDOKU_BOX_H) * SUDOKU_BOX_H,
    bc: Math.floor(c / SUDOKU_BOX_W) * SUDOKU_BOX_W,
  };
}

function isValidPlacement(board: number[][], r: number, c: number, num: number) {
  for (let i = 0; i < SUDOKU_SIZE; i++) {
    if (board[r]![i] === num || board[i]![c] === num) return false;
  }
  const { br, bc } = boxStart(r, c);
  for (let i = br; i < br + SUDOKU_BOX_H; i++) {
    for (let j = bc; j < bc + SUDOKU_BOX_W; j++) {
      if (board[i]![j] === num) return false;
    }
  }
  return true;
}

function fillComplete(board: number[][]): boolean {
  for (let r = 0; r < SUDOKU_SIZE; r++) {
    for (let c = 0; c < SUDOKU_SIZE; c++) {
      if (board[r]![c] !== 0) continue;
      for (const num of shuffle([...SUDOKU_DIGITS])) {
        if (!isValidPlacement(board, r, c, num)) continue;
        board[r]![c] = num;
        if (fillComplete(board)) return true;
        board[r]![c] = 0;
      }
      return false;
    }
  }
  return true;
}

function randomizeSolution(solution: number[][]): SudokuSolution {
  const symbolMap = shuffle([...SUDOKU_DIGITS]);
  const map = (v: number) => symbolMap[v - 1]!;

  const bandOrder = shuffle([0, 1, 2]);
  const stackOrder = shuffle([0, 1]);
  const rowInBand = [shuffle([0, 1]), shuffle([0, 1]), shuffle([0, 1])];
  const colInStack = [shuffle([0, 1, 2]), shuffle([0, 1, 2])];

  const out = Array.from({ length: SUDOKU_SIZE }, () => Array<number>(SUDOKU_SIZE).fill(0));
  for (let br = 0; br < 3; br++) {
    for (let sr = 0; sr < 2; sr++) {
      const srcR = bandOrder[br]! * 2 + rowInBand[bandOrder[br]!]![sr]!;
      const dstR = br * 2 + sr;
      for (let sc = 0; sc < 2; sc++) {
        for (let cc = 0; cc < 3; cc++) {
          const srcC = stackOrder[sc]! * 3 + colInStack[stackOrder[sc]!]![cc]!;
          const dstC = sc * 3 + cc;
          out[dstR]![dstC] = map(solution[srcR]![srcC]!);
        }
      }
    }
  }
  return out;
}

function createPuzzle(solution: SudokuSolution): SudokuGrid {
  const minBlanks = 14;
  const maxBlanks = 24;
  const targetBlanks = minBlanks + Math.floor(Math.random() * (maxBlanks - minBlanks + 1));
  const cells = shuffle(
    Array.from({ length: SUDOKU_SIZE * SUDOKU_SIZE }, (_, i) => ({
      r: Math.floor(i / SUDOKU_SIZE),
      c: i % SUDOKU_SIZE,
    })),
  );

  const grid: SudokuGrid = solution.map((row) => [...row]);
  let blanks = 0;
  for (const { r, c } of cells) {
    if (blanks >= targetBlanks) break;
    grid[r]![c] = null;
    blanks++;
  }
  if (blanks < minBlanks) {
    for (const { r, c } of cells) {
      if (blanks >= minBlanks) break;
      if (grid[r]![c] === null) continue;
      grid[r]![c] = null;
      blanks++;
    }
  }
  return grid;
}

function matrixRowLengths(matrix: unknown): number[] {
  if (!Array.isArray(matrix)) return [];
  return matrix.map((row) => (Array.isArray(row) ? row.length : 0));
}

/** True when grid is exactly 6 rows × 6 columns with digits 1–6 or blanks. */
export function isSudoku6x6Matrix(matrix: unknown): matrix is SudokuGrid | SudokuSolution {
  if (!Array.isArray(matrix) || matrix.length !== SUDOKU_SIZE) return false;
  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== SUDOKU_SIZE) return false;
    for (const cell of row) {
      if (cell === null || cell === undefined || cell === "") continue;
      const n = Number(cell);
      if (!Number.isInteger(n) || n < 1 || n > 6) return false;
    }
  }
  return true;
}

export function generateSudoku6x6(): SudokuPayload {
  const board = Array.from({ length: SUDOKU_SIZE }, () => Array(SUDOKU_SIZE).fill(0));
  if (!fillComplete(board)) {
    throw new Error("Failed to generate 6×6 Sudoku solution");
  }
  const solution = randomizeSolution(board as number[][]);
  const grid = createPuzzle(solution);
  return { grid, solution, size: SUDOKU_SIZE };
}

/** Coerce legacy 4×4 (or malformed) stored puzzles to a fresh 6×6 puzzle. */
export function ensureSudokuPayload(data: unknown): SudokuPayload {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const grid = o.grid;
    const solution = o.solution ?? o.answer;
    const size = Number(o.size);
    const gridOk = isSudoku6x6Matrix(grid);
    const solutionOk = isSudoku6x6Matrix(solution);
    if (gridOk && solutionOk) {
      return {
        grid: grid as SudokuGrid,
        solution: solution as SudokuSolution,
        size: SUDOKU_SIZE,
      };
    }
    if (gridOk && !solutionOk) {
      const gen = generateSudoku6x6();
      return { grid: grid as SudokuGrid, solution: gen.solution, size: SUDOKU_SIZE };
    }
    const lens = matrixRowLengths(grid);
    if (lens.length > 0 && (lens.length !== SUDOKU_SIZE || lens.some((l) => l !== SUDOKU_SIZE))) {
      console.warn("[sudoku6x6] Replacing non-6×6 grid", lens.join("x"));
    }
  }
  return generateSudoku6x6();
}

export function formatSudokuCell(cell: unknown): string {
  if (cell === 0 || cell === "" || cell === null || cell === undefined) return "";
  return String(cell);
}

/** 2×3 block borders for UI cells (n must be 6). */
export function sudokuBlockBorderClasses(r: number, c: number, n: number = SUDOKU_SIZE): string {
  const thickRight = c === 2 && c < n - 1;
  const thickBottom = (r === 1 || r === 3) && r < n - 1;
  return [
    thickRight ? "border-r-[3px] border-r-gray-700" : "",
    thickBottom ? "border-b-[3px] border-b-gray-700" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
