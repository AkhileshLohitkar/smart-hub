import { WORD_SEARCH_CLUES, getWordSearchClue } from "@shared/wordSearchClues";

export const WORD_MEANINGS: Record<string, string> = WORD_SEARCH_CLUES;

export function getWordMeaning(word: string) {
  const clue = getWordSearchClue(word);
  return clue === "Find this hidden word in the grid." ? "Meaning not available" : clue;
}
