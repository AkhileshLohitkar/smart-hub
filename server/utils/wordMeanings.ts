import { WORD_SEARCH_CLUES, getWordSearchClue } from "@shared/wordSearchClues";
import { getCurriculumClue } from "./brainflexCurriculum";
import { lookupTopicClue, isGenericClueText } from "./brainflexTopicClues";

export const WORD_MEANINGS: Record<string, string> = WORD_SEARCH_CLUES;

const runtimeClues = new Map<string, string>();

export function registerBrainflexRuntimeClue(word: string, clue: string) {
  runtimeClues.set(String(word || "").toUpperCase(), clue);
}

export function getWordMeaning(word: string) {
  const u = String(word || "").toUpperCase().trim();
  if (runtimeClues.has(u)) return runtimeClues.get(u)!;
  const topicClue = lookupTopicClue(u);
  if (topicClue) return topicClue;
  const clue = getWordSearchClue(word);
  if (clue !== "Find this hidden word in the grid." && !isGenericClueText(clue)) return clue;
  const curriculum = getCurriculumClue(u);
  if (curriculum) return curriculum;
  return "Meaning not available";
}
