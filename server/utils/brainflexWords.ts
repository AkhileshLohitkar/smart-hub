import { getWordMeaning, registerBrainflexRuntimeClue } from "./wordMeanings";
import {
  type BrainFlexContext,
  isGenericBrainFlexSubject,
  getContextGradeBand,
} from "./brainflexContext";
import {
  resolveCurriculumWordPool,
  getGradeWordLimits,
  NEUTRAL_WORD_BANK,
} from "./brainflexCurriculum";
import { seededShuffle } from "./brainflexUniqueness";
import {
  knowledgeWordPool,
  shouldRejectGenericWord,
  isWordInKnowledge,
} from "./brainflexKnowledge";

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

  const knowledge = ctx?.knowledge;
  let base = resolveCurriculumWordPool({
    board: ctx?.board,
    grade: ctx?.grade,
    subject: ctx?.subject,
    topic: ctx?.topic,
  });

  const seed = (ctx?.generationSeed ?? Date.now()) + (ctx?.generationAttempt ?? 0) * 997;

  // Priority 1: notes-backed knowledge vocabulary
  if (knowledge && knowledge.vocabulary.length >= 6 && knowledge.source === "notes") {
    base = knowledgeWordPool(knowledge);
  } else if (knowledge && knowledge.vocabulary.length > 0) {
    base = [...knowledgeWordPool(knowledge), ...base];
  }

  base = seededShuffle(base, seed);

  // Strict: never merge cross-subject general bank when curriculum is set
  if (!hasCurriculum && !knowledge?.vocabulary.length) {
    base = seededShuffle([...NEUTRAL_WORD_BANK], seed + 17);
  }

  const notesSet = new Set((ctx?.notesVocab ?? []).map((w) => w.toUpperCase()));
  if (knowledge?.source === "notes") {
    for (const w of knowledgeWordPool(knowledge)) notesSet.add(w);
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const w of base) {
    const u = w.toUpperCase();
    if (seen.has(u) || exclude.has(u)) continue;
    if (shouldRejectGenericWord(u, knowledge)) continue;
    if (!/^[A-Z]+$/.test(u) || u.length < minLen || u.length > maxLen) continue;
    // Notes-backed: require word to be in knowledge or have a real clue
    if (knowledge?.source === "notes" && !notesSet.has(u) && !isWordInKnowledge(knowledge, u)) {
      continue;
    }
    if (!notesSet.has(u) && !isWordInKnowledge(knowledge, u) && !isValidBrainflexWord(u, { minLen, maxLen })) {
      continue;
    }
    seen.add(u);
    unique.push(u);
  }

  if (hasCurriculum && unique.length < needed + 10) {
    const { expandTopicVocabularyWithAi } = await import("./brainflexAiExpand");
    const aiWords = await expandTopicVocabularyWithAi(
      ctx ?? {},
      Math.max(needed - unique.length + 12, 10),
    );
    for (const w of aiWords) {
      const u = w.toUpperCase();
      if (seen.has(u) || exclude.has(u)) continue;
      if (!isValidBrainflexWord(u, { minLen, maxLen })) continue;
      seen.add(u);
      unique.push(u);
    }
  }

  return seededShuffle(unique, seed + 53);
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
  const candidates = await buildCandidatePool(ctx, count * 2, opts);
  if (candidates.length === 0) return [];

  const seed = (ctx?.generationSeed ?? Date.now()) + (ctx?.generationAttempt ?? 0) * 991;
  const shuffled = seededShuffle(candidates, seed + 71);

  const picked: string[] = [];
  const seen = new Set<string>();
  for (const w of shuffled) {
    if (picked.length >= count) break;
    const u = w.toUpperCase();
    if (seen.has(u)) continue;
    seen.add(u);
    picked.push(u);
  }

  return picked.slice(0, count);
}
