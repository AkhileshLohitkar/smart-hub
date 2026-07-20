import {
  WORD_SEARCH_CLUES,
  getWordSearchClue,
  isPlaceholderWordSearchClue,
} from "@shared/wordSearchClues";
import { getCurriculumClue } from "./brainflexCurriculum";
import { lookupTopicClue, isGenericClueText } from "./brainflexTopicClues";
import { isNotesPlaceholderClue } from "./brainflexKnowledge";

export const WORD_MEANINGS: Record<string, string> = WORD_SEARCH_CLUES;

const runtimeClues = new Map<string, string>();

export function registerBrainflexRuntimeClue(word: string, clue: string) {
  const c = String(clue || "").trim();
  if (!c || isPlaceholderWordSearchClue(c) || isGenericClueText(c) || isNotesPlaceholderClue(c)) return;
  runtimeClues.set(String(word || "").toUpperCase(), c);
}

/**
 * Dictionary / curriculum meaning used for word validation.
 * Unknown words stay "Meaning not available" so word selection is unchanged.
 * Word Search display uses getWordSearchClue / wordSearchClueForWord instead.
 */
export function getWordMeaning(word: string) {
  const u = String(word || "").toUpperCase().trim();
  if (runtimeClues.has(u)) return runtimeClues.get(u)!;
  const topicClue = lookupTopicClue(u);
  if (topicClue && !isPlaceholderWordSearchClue(topicClue) && !isGenericClueText(topicClue)) {
    return topicClue;
  }
  const curated = WORD_SEARCH_CLUES[u];
  if (curated && !isPlaceholderWordSearchClue(curated) && !isGenericClueText(curated)) {
    return curated;
  }
  const curriculum = getCurriculumClue(u);
  if (curriculum && !isPlaceholderWordSearchClue(curriculum) && !isGenericClueText(curriculum)) {
    return curriculum;
  }
  return "Meaning not available";
}

/** Meaningful educational clue for Word Search display (never a placeholder). */
export function getWordSearchDisplayClue(word: string): string {
  const meaning = getWordMeaning(word);
  if (
    meaning &&
    meaning !== "Meaning not available" &&
    !isPlaceholderWordSearchClue(meaning) &&
    !isGenericClueText(meaning) &&
    !isNotesPlaceholderClue(meaning)
  ) {
    return meaning;
  }
  return getWordSearchClue(word);
}
