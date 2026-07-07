import { getWordMeaning, registerBrainflexRuntimeClue } from "./wordMeanings";
import {
  type BrainFlexContext,
  isGenericBrainFlexSubject,
  shuffle,
  getContextGradeBand,
} from "./brainflexContext";
import {
  resolveCurriculumWordPool,
  getGradeWordLimits,
  NEUTRAL_WORD_BANK,
} from "./brainflexCurriculum";

export function registerBrainflexClue(word: string, clue: string) {
  registerBrainflexRuntimeClue(word, clue);
}

export function getBrainflexWordClue(word: string): string {
  return getWordMeaning(word);
}

export function isValidBrainflexWord(word: string, opts?: { minLen?: number; maxLen?: number }) {
  const w = String(word || "").toUpperCase().trim();
  const minLen = opts?.minLen ?? 4;
  const maxLen = opts?.maxLen ?? 12;
  if (!/^[A-Z]+$/.test(w)) return false;
  if (w.length < minLen || w.length > maxLen) return false;
  return getBrainflexWordClue(w) !== "Meaning not available";
}

async function buildCandidatePool(
  ctx: BrainFlexContext | undefined,
  needed: number,
  opts?: { minLen?: number; maxLen?: number },
): Promise<string[]> {
  const exclude = new Set((ctx?.excludeWords ?? []).map((w) => w.toUpperCase()));
  const band = getContextGradeBand(ctx);
  const limits = getGradeWordLimits(band);
  const minLen = opts?.minLen ?? limits.minLen;
  const maxLen = opts?.maxLen ?? limits.maxLen;

  const hasCurriculum =
    !isGenericBrainFlexSubject(ctx?.subject) || Boolean(ctx?.topic?.trim());

  let base = resolveCurriculumWordPool({
    board: ctx?.board,
    grade: ctx?.grade,
    subject: ctx?.subject,
    topic: ctx?.topic,
  });

  // Strict: never merge cross-subject general bank when curriculum is set
  if (!hasCurriculum) {
    base = [...NEUTRAL_WORD_BANK];
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const w of base) {
    const u = w.toUpperCase();
    if (seen.has(u) || exclude.has(u)) continue;
    if (!isValidBrainflexWord(u, { minLen, maxLen })) continue;
    seen.add(u);
    unique.push(u);
  }

  if (unique.length < needed && hasCurriculum) {
    const { expandTopicVocabularyWithAi } = await import("./brainflexAiExpand");
    const aiWords = await expandTopicVocabularyWithAi(ctx ?? {}, needed - unique.length + 5);
    for (const w of aiWords) {
      const u = w.toUpperCase();
      if (seen.has(u) || exclude.has(u)) continue;
      if (!isValidBrainflexWord(u, { minLen, maxLen })) continue;
      seen.add(u);
      unique.push(u);
    }
  }

  return unique;
}

export function pickBrainflexWords(
  count: number,
  opts?: { minLen?: number; maxLen?: number; maxTries?: number; exclude?: string[] },
): Promise<string[]> {
  return pickBrainflexWordsForContext(count, { excludeWords: opts?.exclude ?? [] }, opts);
}

/** Topic-aware word picker — strict subject isolation, AI fallback when needed. */
export async function pickBrainflexWordsForContext(
  count: number,
  ctx?: BrainFlexContext,
  opts?: { minLen?: number; maxLen?: number; maxTries?: number },
): Promise<string[]> {
  const maxTries = opts?.maxTries ?? 14;
  const candidates = await buildCandidatePool(ctx, count, opts);
  if (candidates.length === 0) return [];

  let best: string[] = [];
  for (let t = 0; t < maxTries; t++) {
    const picked = shuffle(candidates).slice(0, Math.min(count, candidates.length));
    if (picked.length > best.length) best = picked;
    if (best.length >= count) break;
  }
  return best.slice(0, count);
}
