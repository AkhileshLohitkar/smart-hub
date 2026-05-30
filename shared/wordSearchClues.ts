/** Meaningful sentence clues for Word Search (and related Brain-Flex word puzzles). */
export const WORD_SEARCH_CLUES: Record<string, string> = {
  LOGIC: "Reasoning used to solve problems.",
  THINK: "To use your mind to understand something.",
  SMART: "Being intelligent and quick to learn.",
  FOCUS: "To pay full attention to what you are doing.",
  LEARN: "To gain knowledge or a new skill.",
  STUDY: "To spend time learning about a subject.",
  SKILL: "An ability you practice and improve.",
  MEMORY: "The ability to remember things.",
  PATTERN: "A repeated design or sequence.",
  SOLUTION: "The correct answer to a problem.",
  KNOWLEDGE: "Information you learn and understand.",

  NUMBER: "A value used for counting and measuring.",
  MATH: "The study of numbers and calculations.",
  SCIENCE: "The study of nature and how the world works.",
  ENERGY: "Power that makes things move or work.",
  FRACTION: "A part of a whole number.",
  EQUATION: "A math statement showing two sides are equal.",
  PLANET: "A large object that moves around the Sun.",
  NATURE: "The world of plants, animals, and the outdoors.",

  GRAMMAR: "Rules for using language correctly.",
  ADJECTIVE: "A word that describes a noun.",
  LANGUAGE: "Words people use to speak and write.",
  SCHOOL: "A place where students go to learn.",
  TEACHER: "A person who teaches students.",
  STUDENT: "A person who studies in school.",
  READING: "Understanding written words.",
  WRITING: "Making words with letters on paper.",
  HISTORY: "A subject that teaches about past events.",
  GEOGRAPHY: "The study of places and the Earth.",

  COMPUTER: "An electronic machine that runs programs.",
  KEYBOARD: "Keys used to type on a computer.",
  MONITOR: "A screen that shows computer output.",
  INTERNET: "A global network used to connect computers worldwide.",
  PROGRAM: "Instructions a computer follows.",
  PYTHON: "A popular programming language.",
  CODING: "Writing instructions for computers.",
  CODE: "Instructions written for a computer.",

  PUZZLE: "A game or problem that tests your thinking.",
  BRAIN: "The organ you use to think.",
  ANIMAL: "A living creature such as a dog, cat, or bird.",
  GRID: "Rows and columns of squares.",
  SOLVE: "To find the answer to a problem.",

  APPLE: "A round fruit that grows on trees.",
  TRAIN: "A set of cars that runs on tracks.",
  BRIGHT: "Giving a lot of light; also means clever.",
  QUIZ: "A short test with questions.",
  MIND: "Your thoughts and feelings.",
};

export function getWordSearchClue(word: string): string {
  const key = String(word || "").toUpperCase().trim();
  return WORD_SEARCH_CLUES[key] ?? "Find this hidden word in the grid.";
}

export function getWordSearchCluesForWords(words: string[]): string[] {
  return words.map((w) => getWordSearchClue(w));
}

/** Resolve clue sentences from stored Word Search section data. */
export function resolveWordSearchCluesFromData(data: {
  clues?: string[];
  wordsDetailed?: Array<{ word?: string; meaning?: string }>;
  words?: string[];
} | null | undefined): string[] {
  if (!data) return [];
  if (Array.isArray(data.clues) && data.clues.length > 0) {
    return data.clues.map((c) => String(c).trim()).filter(Boolean);
  }
  if (Array.isArray(data.wordsDetailed) && data.wordsDetailed.length > 0) {
    return data.wordsDetailed
      .map((entry) => String(entry?.meaning ?? "").trim())
      .filter(Boolean);
  }
  if (Array.isArray(data.words) && data.words.length > 0) {
    return getWordSearchCluesForWords(data.words.map((w) => String(w)));
  }
  return [];
}
