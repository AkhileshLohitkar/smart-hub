import React, { useMemo } from "react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { WorksheetQrCode } from "@/components/WorksheetQrCode";
import { resolveWordSearchCluesFromData } from "@shared/wordSearchClues";
import {
  SUDOKU_SIZE,
  ensureSudokuPayload,
  formatSudokuCell,
  sudokuBlockBorderClasses,
} from "@shared/sudoku6x6";

const YOUNG_CLASSES = ["Nursery", "KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

const getFontSizes = (isYoungClass: boolean) => ({
  title: isYoungClass ? "text-xl md:text-2xl" : "text-lg md:text-xl",
  subtitle: isYoungClass ? "text-base md:text-lg" : "text-sm md:text-base",
});

const PUZZLE_COLORS: Record<string, string> = {
  sudoku: "bg-blue-50 border-blue-300",
  word_search: "bg-yellow-50 border-yellow-300",
  riddles: "bg-green-50 border-green-300",
  brain_teasers: "bg-purple-50 border-purple-300",
  boggles: "bg-red-50 border-red-300",
  crossword: "bg-indigo-50 border-indigo-300",
};

const TITLE_COLORS: Record<string, string> = {
  sudoku: "text-blue-600",
  word_search: "text-yellow-600",
  riddles: "text-green-600",
  brain_teasers: "text-purple-600",
  boggles: "text-red-600",
  crossword: "text-indigo-700",
};

function getIcon(type: string) {
  switch (type) {
    case "sudoku":
      return "🔢";
    case "word_search":
      return "🔍";
    case "riddles":
      return "🤔";
    case "brain_teasers":
      return "🧠";
    case "boggles":
      return "🔀";
    case "crossword":
      return "🧩";
    default:
      return "📘";
  }
}

function sectionHeading(type: string): string {
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

/** Lettered worksheet labels (school-paper style). */
function sectionSheetLabel(type: string): string {
  switch (type) {
    case "word_search":
      return "Word Search";
    case "riddles":
      return "Riddles";
    case "sudoku":
      return "Sudoku";
    case "boggles":
      return "Unscramble";
    case "brain_teasers":
      return "Brain Teasers";
    case "crossword":
      return "Crossword";
    default:
      return sectionHeading(type);
  }
}

type WorksheetMeta = {
  id?: number;
  content?: unknown;
  className?: string | null;
  difficulty?: string | null;
  topic?: string | null;
  subject?: string | null;
  board?: string | null;
  chapter?: string | null;
  serialNumber?: string | null;
};

export type BrainFlexSection = { type: string; data: unknown };

export type CrosswordClueEntry = { number: number; clue: string; answer: string };

export type CrosswordContent = {
  grid: string[][];
  words: string[];
  clues: (string | CrosswordClueEntry)[];
  crosswordAnswers?: string[];
  answers?: Array<{ word: string; row: number; col: number; direction: string }>;
};

export type BrainFlexContentShape = {
  title?: string;
  theme?: string;
  graphicEmojis?: string[];
  sections?: BrainFlexSection[];
  /** Saved next to sections for Brain-Flex (same payload as crossword section `data`). */
  crossword?: CrosswordContent | null;
  /** @deprecated legacy stored shape */
  puzzles?: any[];
};

const BF_SECTION_ORDER = ["sudoku", "word_search", "riddles", "boggles", "brain_teasers", "crossword"] as const;

function sortBrainFlexSections(sections: BrainFlexSection[]): BrainFlexSection[] {
  return [...sections].sort((a, b) => {
    const ia = BF_SECTION_ORDER.indexOf(String(a.type || "") as (typeof BF_SECTION_ORDER)[number]);
    const ib = BF_SECTION_ORDER.indexOf(String(b.type || "") as (typeof BF_SECTION_ORDER)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

function normalizeSections(content: BrainFlexContentShape | undefined): BrainFlexSection[] {
  if (!content) return [];
  let list: BrainFlexSection[] = [];
  if (Array.isArray(content.sections) && content.sections.length > 0) {
    list = [...content.sections];
  } else if (Array.isArray(content.puzzles) && content.puzzles.length > 0) {
    list = (content.puzzles as any[]).map((p) => {
    const type = String(p?.type || "");
    if (type === "word_search") {
      return {
        type,
        data: {
          grid: p.grid,
          words: p.words,
          clues: p.clues,
          wordsDetailed: p.wordsDetailed,
          answers: p.answers,
          size: p.size,
        },
      };
    }
    if (type === "sudoku") {
      return { type, data: { grid: p.grid, solution: p.solution, size: p.size } };
    }
    if (type === "riddles") {
      return { type, data: p.riddles };
    }
    if (type === "brain_teasers") {
      return { type, data: p.problems };
    }
    if (type === "boggles") {
      return { type, data: p.words };
    }
    if (type === "crossword") {
      return {
        type,
        data: {
          grid: p.grid,
          words: p.words,
          clues: p.clues,
          crosswordAnswers: p.crosswordAnswers,
          answers: p.answers,
        },
      };
    }
    return { type, data: p };
    });
  }

  const topCw = content.crossword;
  if (
    topCw &&
    typeof topCw === "object" &&
    Array.isArray(topCw.grid) &&
    topCw.grid.length > 0 &&
    !list.some((s) => s.type === "crossword")
  ) {
    list = [...list, { type: "crossword", data: topCw }];
  }

  return list;
}

export function BrainFlexRender({
  worksheet,
  content,
  showAnswerKeyOnly = false,
}: {
  worksheet?: WorksheetMeta | null;
  content?: BrainFlexContentShape | null;
  showAnswerKeyOnly?: boolean;
}) {
  const resolved = (content ?? worksheet?.content) as BrainFlexContentShape | undefined;
  const sections = useMemo(() => {
    const list = normalizeSections(resolved);
    if (list.length > 0) return sortBrainFlexSections(list);
    const cw = resolved?.crossword;
    const cwHasGrid = cw && Array.isArray(cw.grid) && cw.grid.length > 0;
    const cwHasWords = cw && Array.isArray(cw.words) && cw.words.length > 0;
    const cwHasClues = cw && Array.isArray(cw.clues) && cw.clues.length > 0;
    if (cw && cwHasGrid && (cwHasWords || cwHasClues)) {
      return sortBrainFlexSections([{ type: "crossword", data: cw }]);
    }
    return [];
  }, [resolved]);
  const refFallback = useMemo(() => `BF-${Date.now()}`, []);

  const getWordSearchCellClasses = (n: number) => {
    // Mobile-first sizing; grows on larger screens.
    // Keep print stable and compact so it fits A4.
    if (n <= 8) return "w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base print:w-8 print:h-8";
    if (n <= 10) return "w-7.5 h-7.5 sm:w-9 sm:h-9 text-sm print:w-7.5 print:h-7.5";
    if (n <= 12) return "w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm print:w-7 print:h-7";
    return "w-6 h-6 sm:w-7 sm:h-7 text-[11px] sm:text-xs print:w-6 print:h-6";
  };

  const renderSudokuGrid = (grid: (number | null)[][]) => {
    return (
      <div className="overflow-x-auto">
        <table className="border-collapse font-sans border-2 border-gray-700">
          <tbody>
            {Array.from({ length: SUDOKU_SIZE }, (_, r) => (
              <tr key={r}>
                {Array.from({ length: SUDOKU_SIZE }, (_, c) => (
                  <td
                    key={c}
                    className={[
                      "w-8 h-8 border border-gray-500 bg-white text-black font-semibold text-sm text-center align-middle aspect-square",
                      sudokuBlockBorderClasses(r, c),
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {formatSudokuCell(grid[r]?.[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWordSearchGrid = (
    gridRaw: any[][],
    highlighted?: Set<string>,
  ) => {
    const grid = (gridRaw || []).map((row: any[]) => row.map((cell) => String(cell ?? "").trim().toUpperCase()));
    const n = grid.length || 0;
    const cellSize = getWordSearchCellClasses(n);

    return (
      <div className="overflow-x-auto">
        <div className="inline-block rounded-xl border-2 border-yellow-400/70 bg-white p-2 print:p-1">
          <div
            className="grid gap-1 print:gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, n)}, minmax(0, 1fr))` }}
          >
            {grid.map((row: string[], r: number) =>
              row.map((cell: string, c: number) => {
                const key = `${r}:${c}`;
                const isHighlighted = highlighted?.has(key) ?? false;
                const ch = String(cell ?? "").toUpperCase();
                return (
                  <div
                    key={key}
                    className={[
                      cellSize,
                      "rounded-md border-2 flex items-center justify-center font-bold uppercase select-none",
                      "bg-white text-gray-900 border-gray-500/70",
                      "print:border-gray-700",
                      isHighlighted
                        ? "bg-green-200/80 border-green-700 shadow-[inset_0_0_0_1px_rgba(21,128,61,0.35)]"
                        : "",
                    ].join(" ")}
                  >
                    {ch}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!resolved) {
    return (
      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
        No Brain-Flex content available.
      </div>
    );
  }

  const meta = worksheet as WorksheetMeta | null | undefined;
  const displayClassName = meta?.className?.trim() || "Grade 8";
  const isYoungClass = YOUNG_CLASSES.includes(displayClassName);
  const fonts = getFontSizes(isYoungClass);

  const chapterStr = meta?.chapter?.trim() || "";
  const topicStr = meta?.topic?.trim() || meta?.subject?.trim() || "";
  const displayBoard = (meta?.board?.trim() || "STATE BOARD").toUpperCase();
  const displayDifficulty = (meta?.difficulty?.trim() || "BEGINNER").toUpperCase();
  const refLine = meta?.serialNumber?.trim() || refFallback;

  const brandHeader = (
    <div className="flex justify-end mb-2 print:mb-1.5">
      <img
        src={logoImage}
        alt="Qik Worksheets"
        className="h-[84px] w-[84px] sm:h-[88px] sm:w-[88px] object-contain logo-vibrant print:h-[80px] print:w-[80px]"
        draggable={false}
        data-testid="brainflex-worksheet-logo"
      />
    </div>
  );

  const headerBlock = (
    <div className="border-b-2 border-black pb-3 mb-4 print:pb-2 print:mb-3">
      {brandHeader}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h1
            className={`${fonts.title} font-bold font-display leading-tight text-black break-words`}
            data-testid="text-brainflex-worksheet-title"
          >
            {displayClassName} — Brain Flex
          </h1>
          {chapterStr || topicStr ? (
            <p
              className={`${fonts.subtitle} font-semibold mt-0.5 text-gray-800`}
              data-testid="text-brainflex-worksheet-subtitle"
            >
              {chapterStr && chapterStr !== topicStr ? `${chapterStr} : ` : ""}
              {topicStr || chapterStr}
            </p>
          ) : (
            <p className={`${fonts.subtitle} font-semibold mt-0.5 text-gray-800`}>Brain Flex Activities</p>
          )}
          <p className="text-gray-800 dark:text-gray-300 font-sans text-xs font-semibold mt-1 tracking-wide" data-testid="text-brainflex-worksheet-serial">
            Ref: {refLine}
          </p>
          <p className="text-gray-600 dark:text-gray-400 font-sans text-[10px] uppercase tracking-widest mt-0.5" data-testid="text-brainflex-worksheet-meta">
            {displayBoard} • {displayDifficulty}
          </p>
        </div>
        {meta?.id ? (
          <div className="shrink-0 print:block">
            <WorksheetQrCode worksheetId={meta.id} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 font-sans text-sm">
        <div className="flex items-end gap-2 flex-1 min-w-[140px]">
          <span className="font-semibold whitespace-nowrap text-xs">Name:</span>
          <div className="border-b border-gray-400 w-full print:border-gray-600" />
        </div>
        <div className="flex items-end gap-2 w-32 sm:w-36">
          <span className="font-semibold whitespace-nowrap text-xs">Date:</span>
          <div className="border-b border-gray-400 w-full print:border-gray-600" />
        </div>
        <div className="flex items-end gap-2 w-24 sm:w-28">
          <span className="font-semibold whitespace-nowrap text-xs">Score:</span>
          <div className="border-b border-gray-400 w-full print:border-gray-600" />
        </div>
      </div>
    </div>
  );

  if (sections.length === 0 && !showAnswerKeyOnly) {
    return (
      <div className="text-black max-w-[800px] mx-auto p-4 bg-white print:max-w-none">
        {headerBlock}
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">No puzzles available.</div>
      </div>
    );
  }

  if (sections.length === 0 && showAnswerKeyOnly) {
    return (
      <p className="text-sm text-gray-600">No answer key is available for this sheet.</p>
    );
  }

  return (
    <div className="brain-flex-worksheet text-black max-w-[800px] mx-auto p-4 bg-white print:max-w-none print:p-0 print:mx-0">
      {!showAnswerKeyOnly && headerBlock}

      {!showAnswerKeyOnly && (
      <div className="space-y-3 print:space-y-1">
        {sections.map((section, idx) => {
          const type = String(section.type || "");
          const title = sectionHeading(type);
          const d = section.data as any;
          const letter = String.fromCharCode(65 + idx);

          return (
            <div key={idx} className="bf-section">
              <h3 className="font-bold text-base mb-2 text-black print:mb-0.5 print:text-sm">
                {letter}. {sectionSheetLabel(type)}
              </h3>
              <div
                className={`rounded-xl p-4 mb-3 border print:p-2 print:mb-1 print:rounded-lg ${PUZZLE_COLORS[type] || "bg-gray-50 border-gray-200"}`}
              >
              <div className="flex items-center gap-2 mb-2 print:mb-1 print:gap-1">
                <span className="text-lg leading-none">{getIcon(type)}</span>
                <h2 className={`font-display font-bold text-base ${TITLE_COLORS[type] || "text-slate-700"}`}>{title}</h2>
              </div>

              {type === "sudoku" && d && (
                <div className="pl-1 bf-keep-together">{renderSudokuGrid(ensureSudokuPayload(d).grid)}</div>
              )}

              {type === "word_search" && d && (
                <div className="space-y-2 pl-1">
                  {Array.isArray(d?.grid) ? renderWordSearchGrid(d.grid) : null}
                  {(() => {
                    const clues = resolveWordSearchCluesFromData(d as Record<string, unknown>);
                    if (clues.length === 0) return null;
                    return (
                      <div className="font-sans text-xs text-black space-y-1.5">
                        <p className="font-semibold">Find the hidden words using clues:</p>
                        <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                          {clues.map((clue, i) => (
                            <li key={i}>{clue}</li>
                          ))}
                        </ol>
                      </div>
                    );
                  })()}
                </div>
              )}

              {type === "riddles" && Array.isArray(d) && (
                <div className="space-y-2 pl-1">
                  {d.map((r: any, i: number) => (
                    <div key={i} className="text-xs">
                      <div className="font-medium text-black">
                        {i + 1}. {String(r?.question ?? "")}
                      </div>
                      <div className="mt-1 border-b border-dashed border-gray-400 h-3 w-full" />
                    </div>
                  ))}
                </div>
              )}

              {type === "brain_teasers" && Array.isArray(d) && (
                <div className="space-y-2 pl-1">
                  {d.map((t: any, i: number) => (
                    <div key={i} className="text-xs">
                      <div className="font-medium text-black">
                        {i + 1}. {String(t?.question ?? "")}
                      </div>
                      <div className="mt-1 border-b border-dashed border-gray-400 h-3 w-full" />
                    </div>
                  ))}
                </div>
              )}

              {type === "boggles" && Array.isArray(d) && (
                <div className="space-y-1.5 pl-1">
                  {d.map((w: any, i: number) => (
                    <div key={i} className="flex items-baseline gap-3 text-xs">
                      <div className="font-semibold text-red-700">
                        {i + 1}. {String(w?.scrambled ?? "")}
                      </div>
                      <div className="text-gray-700 dark:text-gray-400 italic">{String(w?.hint ?? "")}</div>
                      <div className="flex-1 border-b border-dashed border-gray-400" />
                    </div>
                  ))}
                </div>
              )}

              {type === "crossword" && d && Array.isArray((d as any)?.grid) && (
                <div className="pl-1">
                  {(() => {
                    const grid = (d as any).grid as string[][];
                    const nums = (d as any).clueNumbersGrid as Array<Array<number | null>> | undefined;
                    const across = (d as any).across as CrosswordClueEntry[] | undefined;
                    const down = (d as any).down as CrosswordClueEntry[] | undefined;
                    const wordBank = (d as any).wordBank as string[] | undefined;

                    const isLetter = (ch: string) => ch !== "#" && ch !== "·" && ch !== "";
                    let minR = Infinity,
                      minC = Infinity,
                      maxR = -Infinity,
                      maxC = -Infinity;
                    for (let r = 0; r < grid.length; r++) {
                      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
                        const ch = String(grid[r]?.[c] ?? "");
                        if (!isLetter(ch)) continue;
                        minR = Math.min(minR, r);
                        minC = Math.min(minC, c);
                        maxR = Math.max(maxR, r);
                        maxC = Math.max(maxC, c);
                      }
                    }
                    if (!Number.isFinite(minR)) return null;
                    const rows = maxR - minR + 1;
                    const cols = maxC - minC + 1;

                    const bank =
                      Array.isArray(wordBank) && wordBank.length > 0
                        ? wordBank
                        : Array.isArray((d as any)?.words)
                          ? ((d as any).words as any[])
                          : [];

                    return (
                      <div className="space-y-5 print:space-y-2">
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-center md:justify-start print:gap-3">
                          <div className="w-full md:w-auto flex justify-center md:justify-start bf-keep-together">
                            <div
                              className="grid bf-keep-together"
                              style={{
                                // Smaller, print-friendly crossword cells (28px).
                                gridTemplateColumns: `repeat(${cols}, 28px)`,
                                gridTemplateRows: `repeat(${rows}, 28px)`,
                              }}
                            >
                              {Array.from({ length: rows * cols }).map((_, idx) => {
                                const r = minR + Math.floor(idx / cols);
                                const c = minC + (idx % cols);
                                const ch = String(grid?.[r]?.[c] ?? "");
                                const active = isLetter(ch);
                                const n = nums?.[r]?.[c] ?? null;

                                if (!active) {
                                  return <div key={idx} style={{ width: 28, height: 28 }} />;
                                }

                                return (
                                  <div
                                    key={idx}
                                    className="border-2 border-black bg-white relative flex items-center justify-center rounded-md"
                                    style={{ width: 28, height: 28 }}
                                  >
                                    {typeof n === "number" && n > 0 ? (
                                      <div className="absolute top-0.5 left-0.5 text-[9px] font-bold leading-none text-black">
                                        {n}
                                      </div>
                                    ) : null}
                                    {/* Student worksheet: leave blank */}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="w-full md:w-[240px] space-y-4 print:space-y-2">
                            <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50 w-full print:p-2 print:rounded-lg">
                              <h3 className="font-bold text-emerald-700 mb-2">Across</h3>
                              <div className="space-y-1.5 text-sm text-black leading-relaxed break-words">
                                {(Array.isArray(across) ? across : []).map((clue, i) => (
                                  <p key={i} className="break-words">
                                    <span className="font-bold">{clue.number}.</span>{" "}
                                    <span className="break-words">{clue.clue}</span>
                                  </p>
                                ))}
                              </div>
                            </div>

                            <div className="border border-sky-200 rounded-2xl p-4 bg-sky-50 w-full print:p-2 print:rounded-lg">
                              <h3 className="font-bold text-sky-700 mb-2">Down</h3>
                              <div className="space-y-1.5 text-sm text-black leading-relaxed break-words">
                                {(Array.isArray(down) ? down : []).map((clue, i) => (
                                  <p key={i} className="break-words">
                                    <span className="font-bold">{clue.number}.</span>{" "}
                                    <span className="break-words">{clue.clue}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-green-400 rounded-2xl p-4 bg-green-50 print:p-2 print:rounded-lg">
                          <h3 className="font-bold text-green-700 text-center mb-3">Word Bank</h3>
                          <div className="grid grid-cols-2 gap-y-2 text-center text-xs font-semibold text-green-900">
                            {bank.map((w: any, i: number) => (
                              <div key={`${String(w)}-${i}`}>{String(w)}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {showAnswerKeyOnly && (
      <div className="bf-answer-key">
        <div className="space-y-4 print:space-y-2 text-sm">
          {sections.map((section, idx) => {
            const type = String(section.type || "");
            const d = section.data as any;

            return (
              <div key={idx} className="bf-section">
                {type === "sudoku" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 print:p-2">
                    <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">🧩 Sudoku Solution</h4>

                    {(() => {
                      const { solution } = ensureSudokuPayload(d);
                      return (
                        <div className="inline-block border-2 border-gray-700 bg-white bf-keep-together">
                          {Array.from({ length: SUDOKU_SIZE }, (_, rowIndex) => (
                            <div key={rowIndex} className="flex">
                              {Array.from({ length: SUDOKU_SIZE }, (_, colIndex) => (
                                <div
                                  key={colIndex}
                                  className={[
                                    "w-8 h-8 flex items-center justify-center border border-gray-400 text-sm font-semibold text-green-700 bg-green-50 aspect-square",
                                    sudokuBlockBorderClasses(rowIndex, colIndex),
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                >
                                  {formatSudokuCell(solution[rowIndex]?.[colIndex])}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {type === "word_search" && (d?.grid || d?.words) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:p-2">
                    <h4 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">🔍 Word Search Solution</h4>

                    {(() => {
                      const wordGridRaw = d?.grid;
                      const hasGrid =
                        Array.isArray(wordGridRaw) && wordGridRaw.length > 0 && Array.isArray(wordGridRaw[0]);

                      const wordsRaw = Array.isArray(d?.words) ? (d.words as any[]) : [];
                      const words = wordsRaw.map((w) => String(w ?? "").trim()).filter(Boolean);

                      if (!hasGrid) {
                        return <p className="text-xs text-red-500">Word search solution unavailable</p>;
                      }

                      const wordGrid = (wordGridRaw as any[]).map((row: any[]) =>
                        row.map((cell) => String(cell ?? "").trim().toUpperCase()),
                      );

                      const rows = wordGrid.length;
                      const cols = rows > 0 ? wordGrid[0].length : 0;

                      const inBounds = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < cols;

                      const dirFromMeta = (dir: string): { dr: number; dc: number } | null => {
                        const d0 = String(dir || "").toLowerCase();
                        if (d0 === "horizontal" || d0 === "across" || d0 === "right") return { dr: 0, dc: 1 };
                        if (d0 === "left") return { dr: 0, dc: -1 };
                        if (d0 === "vertical" || d0 === "down") return { dr: 1, dc: 0 };
                        if (d0 === "up") return { dr: -1, dc: 0 };
                        if (d0 === "diag_down" || d0 === "diagonal_down" || d0 === "down_right") return { dr: 1, dc: 1 };
                        if (d0 === "down_left") return { dr: 1, dc: -1 };
                        if (d0 === "up_right") return { dr: -1, dc: 1 };
                        if (d0 === "up_left") return { dr: -1, dc: -1 };
                        return null;
                      };

                      const highlighted = new Set<string>();

                      // 1) Prefer backend-provided metadata if present.
                      const answersRaw = Array.isArray(d?.answers) ? (d.answers as any[]) : [];
                      if (answersRaw.length > 0) {
                        for (const a of answersRaw) {
                          const word = String(a?.word ?? "").trim().toUpperCase();
                          const row = Number(a?.row);
                          const col = Number(a?.col);
                          const dir = dirFromMeta(a?.direction);
                          if (!word || Number.isNaN(row) || Number.isNaN(col) || !dir) continue;
                          for (let i = 0; i < word.length; i++) {
                            const r = row + dir.dr * i;
                            const c = col + dir.dc * i;
                            if (!inBounds(r, c)) break;
                            highlighted.add(`${r}:${c}`);
                          }
                        }
                      } else if (words.length > 0) {
                        // 2) Fallback: locate words in grid (student-friendly directions only).
                        // Keep aligned with server generation rules: left→right and top→bottom only.
                        const dirs = [
                          { dr: 0, dc: 1 }, // →
                          { dr: 1, dc: 0 }, // ↓
                        ];

                        const matchesWordAt = (word: string, r0: number, c0: number, dr: number, dc: number) => {
                          for (let i = 0; i < word.length; i++) {
                            const r = r0 + dr * i;
                            const c = c0 + dc * i;
                            if (!inBounds(r, c)) return false;
                            if (wordGrid[r][c] !== word[i]) return false;
                          }
                          return true;
                        };

                        const markWordAt = (word: string, r0: number, c0: number, dr: number, dc: number) => {
                          for (let i = 0; i < word.length; i++) {
                            highlighted.add(`${r0 + dr * i}:${c0 + dc * i}`);
                          }
                        };

                        for (const w of words) {
                          const word = w.toUpperCase().replace(/\s+/g, "");
                          if (!word) continue;
                          let found = false;
                          for (let r = 0; r < rows && !found; r++) {
                            for (let c = 0; c < cols && !found; c++) {
                              for (const dir of dirs) {
                                if (matchesWordAt(word, r, c, dir.dr, dir.dc)) {
                                  markWordAt(word, r, c, dir.dr, dir.dc);
                                  found = true;
                                  break;
                                }
                              }
                            }
                          }
                        }
                      }

                      return (
                        <div className="bf-keep-together">
                          {renderWordSearchGrid(wordGrid, highlighted)}

                          {words.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {words.map((word, i) => (
                                <span key={`${word}-${i}`} className="px-2 py-1 bg-green-200 rounded text-xs font-semibold">
                                  {word}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {type === "riddles" && Array.isArray(d) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 print:p-2">
                    <h4 className="font-semibold text-green-700 mb-2">🤔 Riddles Answers</h4>

                    {d.map((r, i) => (
                      <p key={i} className="text-sm">
                        {i + 1}. {String(r?.answer ?? "")}
                      </p>
                    ))}
                  </div>
                )}

                {type === "boggles" && Array.isArray(d) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 print:p-2">
                    <h4 className="font-semibold text-red-600 mb-2">🔀 Unscramble Answers</h4>

                    {d.map((w, i) => (
                      <p key={i}>
                        {i + 1}. <span className="font-bold">{String(w?.original ?? w?.answer ?? "")}</span>
                      </p>
                    ))}
                  </div>
                )}

                {type === "crossword" && d && Array.isArray(d?.grid) && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 print:p-2">
                    <h4 className="font-semibold text-indigo-700 mb-3 flex items-center gap-2">🧩 Crossword Solution</h4>

                    {(() => {
                      const crosswordGrid = d?.grid;
                      const hasGrid =
                        Array.isArray(crosswordGrid) && crosswordGrid.length > 0 && Array.isArray(crosswordGrid[0]);

                      if (!hasGrid) {
                        return <p className="text-xs text-red-500">Crossword solution unavailable</p>;
                      }

                      const answersRaw = Array.isArray(d?.answers) ? d.answers : [];
                      const highlightedCells: Array<{ row: number; col: number }> = [];

                      for (const a of answersRaw) {
                        const word = String(a?.word ?? "");
                        const row = Number(a?.row);
                        const col = Number(a?.col);
                        const direction = String(a?.direction ?? "");
                        if (!word || Number.isNaN(row) || Number.isNaN(col)) continue;
                        for (let i = 0; i < word.length; i++) {
                          highlightedCells.push({
                            row: direction === "down" ? row + i : row,
                            col: direction === "across" ? col + i : col,
                          });
                        }
                      }

                      const highlightCount = new Map<string, number>();
                      for (const h of highlightedCells) {
                        const k = `${h.row}:${h.col}`;
                        highlightCount.set(k, (highlightCount.get(k) ?? 0) + 1);
                      }
                      const highlightKey = new Set(highlightedCells.map((h) => `${h.row}:${h.col}`));
                      const clueNums = d?.clueNumbersGrid as Array<Array<number | null>> | undefined;
                      const solvedGrid = (crosswordGrid as any[]).map((row: any[]) => row.map((cell) => String(cell ?? "")));

                      // Fill grid letters from answer metadata when grid has blanks.
                      for (const a of answersRaw) {
                        const word = String(a?.word ?? "");
                        const row = Number(a?.row);
                        const col = Number(a?.col);
                        const direction = String(a?.direction ?? "");
                        if (!word || Number.isNaN(row) || Number.isNaN(col)) continue;
                        for (let i = 0; i < word.length; i++) {
                          const r = direction === "down" ? row + i : row;
                          const c = direction === "across" ? col + i : col;
                          if (!solvedGrid[r] || typeof solvedGrid[r][c] !== "string") continue;
                          const existing = String(solvedGrid[r][c] ?? "");
                          const isBlock = existing === "#" || existing === "·";
                          if (isBlock) continue;
                          solvedGrid[r][c] = word[i] ?? existing;
                        }
                      }

                      return (
                        <div className="bf-keep-together">
                          {(() => {
                            const isLetter = (ch: string) => ch !== "#" && ch !== "·" && ch !== "";
                            let minR = Infinity,
                              minC = Infinity,
                              maxR = -Infinity,
                              maxC = -Infinity;
                            for (let r = 0; r < solvedGrid.length; r++) {
                              for (let c = 0; c < (solvedGrid[r]?.length ?? 0); c++) {
                                const ch = String(solvedGrid[r]?.[c] ?? "");
                                if (!isLetter(ch)) continue;
                                minR = Math.min(minR, r);
                                minC = Math.min(minC, c);
                                maxR = Math.max(maxR, r);
                                maxC = Math.max(maxC, c);
                              }
                            }
                            if (!Number.isFinite(minR)) return null;
                            const rows = maxR - minR + 1;
                            const cols = maxC - minC + 1;

                            return (
                              <div className="flex justify-center md:justify-start">
                                <div
                                  className="grid bf-keep-together"
                                  style={{
                                    gridTemplateColumns: `repeat(${cols}, 2.25rem)`,
                                    gridTemplateRows: `repeat(${rows}, 2.25rem)`,
                                  }}
                                >
                                  {Array.from({ length: rows * cols }).map((_, idx) => {
                                    const r = minR + Math.floor(idx / cols);
                                    const c = minC + (idx % cols);
                                    const ch = String(solvedGrid?.[r]?.[c] ?? "");
                                    const active = isLetter(ch);
                                    if (!active) return <div key={idx} className="w-9 h-9" />;

                                    const isHighlighted = highlightKey.has(`${r}:${c}`);
                                    const isIntersection = (highlightCount.get(`${r}:${c}`) ?? 0) > 1;
                                    const n = clueNums?.[r]?.[c] ?? null;

                                    return (
                                      <div
                                        key={idx}
                                        className={[
                                          "w-9 h-9 border-2 border-black bg-white relative flex items-center justify-center font-semibold text-base",
                                          isHighlighted
                                            ? isIntersection
                                              ? "bg-orange-300"
                                              : "bg-yellow-300"
                                            : "bg-white",
                                        ].join(" ")}
                                      >
                                        {typeof n === "number" && n > 0 ? (
                                          <div className="absolute top-0 left-1 text-[8px] font-bold leading-none text-black">{n}</div>
                                        ) : null}
                                        <span className="text-black">{ch}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {Array.isArray(d?.clues) && d.clues.length > 0 && (
                            <div className="mt-4 space-y-1 text-sm">
                              {(d.clues as any[]).map((clue, i: number) => {
                                const isObj = clue && typeof clue === "object" && "clue" in clue;
                                const text = isObj ? String(clue?.clue ?? "") : String(clue ?? "");
                                return (
                                  <p key={i} className="text-gray-800">
                                    {i + 1}. {text}
                                  </p>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {type === "brain_teasers" && Array.isArray(d) && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 print:p-2">
                    <h4 className="font-semibold text-purple-700 mb-2">🧠 Brain Teasers Answers</h4>

                    {d.map((t, i) => (
                      <p key={i}>
                        {i + 1}. {String(t?.answer ?? "")}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}

export default BrainFlexRender;
