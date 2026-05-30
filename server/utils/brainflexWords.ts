import { getWordMeaning } from "./wordMeanings";

export const BRAINFLEX_WORD_BANK = [
  "MATH",
  "SCIENCE",
  "ENERGY",
  "LOGIC",
  "FOCUS",
  "SMART",
  "THINK",
  "NUMBER",
  "PUZZLE",
  "LEARN",
  "PLANET",
  "GRAMMAR",
  "ADJECTIVE",
  "FRACTION",
  "EQUATION",
  "LANGUAGE",
  "ANIMAL",
  "NATURE",
  "SCHOOL",
  "TEACHER",
  "STUDENT",
  "READING",
  "WRITING",
  "HISTORY",
  "GEOGRAPHY",
  "COMPUTER",
  "KEYBOARD",
  "MONITOR",
  "INTERNET",
  "PROGRAM",
  "PYTHON",
  "CODING",
  "BRAIN",
  "MEMORY",
  "PATTERN",
  "SOLUTION",
  "KNOWLEDGE",
].map((w) => w.toUpperCase());

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function isValidBrainflexWord(word: string, opts?: { minLen?: number; maxLen?: number }) {
  const w = String(word || "").toUpperCase().trim();
  const minLen = opts?.minLen ?? 4;
  const maxLen = opts?.maxLen ?? 12;
  if (!/^[A-Z]+$/.test(w)) return false;
  if (w.length < minLen || w.length > maxLen) return false;
  return getWordMeaning(w) !== "Meaning not available";
}

export function pickBrainflexWords(
  count: number,
  opts?: { minLen?: number; maxLen?: number; maxTries?: number; exclude?: string[] },
): string[] {
  const exclude = new Set((opts?.exclude ?? []).map((w) => String(w || "").toUpperCase().trim()).filter(Boolean));
  const maxTries = opts?.maxTries ?? 6;

  const candidates = BRAINFLEX_WORD_BANK.filter((w) => !exclude.has(w)).filter((w) => isValidBrainflexWord(w, opts));
  if (candidates.length === 0) return [];

  // Shuffle a few times to avoid bias from sort order.
  let best: string[] = [];
  for (let t = 0; t < maxTries; t++) {
    const picked = shuffle(candidates).slice(0, Math.min(count, candidates.length));
    if (picked.length > best.length) best = picked;
    if (best.length >= count) break;
  }
  return best;
}

