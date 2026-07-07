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

  // Science / photosynthesis
  PLANTS: "Living things that make their own food using sunlight.",
  LEAVES: "Flat green parts of a plant.",
  CHLOROPHYLL: "Green pigment that helps plants capture sunlight.",
  SUNLIGHT: "Light from the Sun used by plants.",
  OXYGEN: "A gas we breathe that plants release.",
  CARBON: "An element found in carbon dioxide.",
  RESPIRATION: "How living things use oxygen to release energy from food.",
  GLUCOSE: "Sugar made by plants during photosynthesis.",
  STOMATA: "Tiny openings on leaves for gas exchange.",
  ROOTS: "Underground parts that absorb water.",
  STEMS: "Plant parts that support leaves and flowers.",
  WATER: "A liquid plants need to grow.",
  SOIL: "Earth where plants grow.",
  SEEDS: "Parts of a plant that can grow into new plants.",
  FLOWER: "The colourful reproductive part of many plants.",
  GREEN: "The colour of healthy leaves.",
  CELLS: "The smallest living units in organisms.",
  TISSUE: "A group of similar cells working together.",

  // Maths / fractions
  NUMERATOR: "The top number in a fraction.",
  DENOMINATOR: "The bottom number in a fraction.",
  DECIMAL: "A number with a point, like 0.5.",
  RATIO: "A comparison of two quantities.",
  PERCENT: "A fraction out of one hundred.",
  DIVIDE: "To split into equal parts.",
  MULTIPLY: "To add a number to itself many times.",
  SUM: "The result of addition.",
  DIFFERENCE: "The result of subtraction.",
  PRODUCT: "The result of multiplication.",
  QUOTIENT: "The result of division.",
  EQUIVALENT: "Equal in value, like 1/2 and 2/4.",
  INTEGER: "A whole number without fractions.",
  DIGIT: "A single symbol from 0 to 9.",
  ROUND: "To adjust a number to the nearest whole.",
  CALCULATE: "To work out an answer using maths.",

  // English / grammar
  NOUN: "A word that names a person, place, or thing.",
  VERB: "A word that shows an action or state.",
  PRONOUN: "A word that replaces a noun, like he or she.",
  TENSE: "The form of a verb showing past, present, or future.",
  ARTICLE: "A word like a, an, or the before a noun.",
  SENTENCE: "A group of words that expresses a complete thought.",
  PHRASE: "A small group of words without a full verb.",
  SPELLING: "Writing words with correct letters.",
  VOWEL: "Letters A, E, I, O, U.",
  CONSONANT: "A letter that is not a vowel.",
  PLURAL: "More than one of something.",
  SINGULAR: "Just one of something.",
  STORY: "A tale with characters and events.",
  POEM: "Writing arranged in lines, often with rhyme.",
  ALPHABET: "The set of letters used in a language.",

  // History / geography extras
  PAST: "Time that has already happened.",
  EVENT: "Something important that happens.",
  EMPEROR: "A ruler of an empire.",
  KINGDOM: "Land ruled by a king or queen.",
  REVOLT: "An uprising against authority.",
  FREEDOM: "The right to act and speak freely.",
  NATION: "A country with its own people and government.",
  CULTURE: "Customs, arts, and beliefs of a group.",
  TRADITION: "A custom passed down over time.",
  HERITAGE: "Valued things passed from past generations.",
  MONUMENT: "A structure built to remember someone or something.",
  LEADER: "A person who guides others.",
  RULE: "A law or principle to follow.",
  TREATY: "An agreement between countries or groups.",
  MAP: "A drawing that shows places.",
  GLOBE: "A round model of the Earth.",
  RIVER: "A long body of flowing water.",
  MOUNTAIN: "A very high area of land.",
  PLATEAU: "Flat high land with steep sides.",
  DESERT: "A dry area with little rain.",
  FOREST: "A large area covered with trees.",
  CLIMATE: "The usual weather of a place.",
  RAINFALL: "Water that falls as rain.",
  OCEAN: "A very large body of salt water.",
  CONTINENT: "One of the large land masses on Earth.",
  COUNTRY: "A nation with its own government.",
  CAPITAL: "The main city of a country.",
  LATITUDE: "Distance north or south of the equator.",

  // Computer science extras
  ALGORITHM: "A step-by-step method to solve a problem.",
  BINARY: "A number system using only 0 and 1.",
  DATA: "Information stored or processed by a computer.",
  INPUT: "Information sent into a computer.",
  OUTPUT: "Information produced by a computer.",
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
