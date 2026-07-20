/**
 * Topic-specific Word Search / Crossword clues for Brain-Flex.
 * Generation-only — unique educational definitions per word.
 */

export const PHOTOSYNTHESIS_CLUES: Record<string, string> = {
  PLANTS: "Living organisms that make food using sunlight.",
  LEAVES: "Main location where photosynthesis takes place.",
  LEAF: "Flat green part of a plant that captures sunlight.",
  CHLOROPHYLL: "Green pigment that absorbs sunlight for photosynthesis.",
  SUNLIGHT: "Main source of energy used during photosynthesis.",
  OXYGEN: "Gas released by plants during photosynthesis.",
  CARBON: "Element plants use from carbon dioxide to make food.",
  GLUCOSE: "Sugar produced as food during photosynthesis.",
  STOMATA: "Tiny pores on leaves that allow gas exchange.",
  ROOTS: "Plant parts that absorb water and minerals from soil.",
  STEMS: "Plant parts that transport water and support leaves.",
  STEM: "Structure that carries water between roots and leaves.",
  WATER: "Essential liquid absorbed by roots for photosynthesis.",
  SOIL: "Earth that provides minerals and water to plants.",
  SEEDS: "Plant structures that can grow into new plants.",
  GREEN: "Colour of leaves due to chlorophyll.",
  CHLOROPLAST: "Cell organelle where photosynthesis occurs.",
  XYLEM: "Tissue that transports water from roots to leaves.",
  PHLOEM: "Tissue that transports food made in leaves.",
  STARCH: "Stored form of food made from glucose in plants.",
  SUGAR: "Simple carbohydrate produced during photosynthesis.",
  FOOD: "Glucose and starch made by plants for energy.",
  ENERGY: "Power captured from sunlight to make food.",
  LIGHT: "Form of energy from the Sun used by plants.",
  MINERAL: "Nutrients from soil needed for healthy plant growth.",
  NITROGEN: "Nutrient from soil important for leaf growth.",
  PHOTON: "Particle of light energy absorbed by chlorophyll.",
  AUTOTROPH: "Organism that makes its own food using sunlight.",
  TRANSPIRE: "Process by which plants lose water vapour from leaves.",
  GUARDCELL: "Cells that control opening and closing of stomata.",
  MESOPHYLL: "Inner leaf tissue where most photosynthesis happens.",
  EPIDERMIS: "Outer protective layer of a leaf.",
  PIGMENT: "Coloured substance like chlorophyll that absorbs light.",
  RESPIRATION: "Process plants use to release energy from glucose.",
  SPROUT: "Young plant that grows from a seed.",
  GERMINATE: "When a seed begins to grow into a plant.",
  GROWTH: "Increase in plant size as food is produced.",
  SHADE: "Area with less sunlight where photosynthesis slows.",
  CANOPY: "Upper layer of leaves that receives the most sunlight.",
};

export const CELL_CLUES: Record<string, string> = {
  CELL: "Basic unit of life in all living organisms.",
  TISSUE: "Group of similar cells working together.",
  ORGAN: "Structure made of tissues that performs a function.",
  NUCLEUS: "Control centre of a cell that holds DNA.",
  CYTOPLASM: "Jelly-like fluid inside a cell.",
  MEMBRANE: "Thin outer boundary that controls what enters a cell.",
  WALL: "Rigid outer layer found in plant cells.",
  VACUOLE: "Storage structure inside plant cells.",
  MITOCHONDRIA: "Organelle that releases energy from food.",
  CHLOROPLAST: "Green organelle where photosynthesis occurs.",
  RIBOSOME: "Tiny structure that builds proteins in a cell.",
  GENE: "Unit of heredity passed from parents to offspring.",
  DNA: "Molecule that carries genetic instructions.",
  PROTEIN: "Molecule made by cells for growth and repair.",
  ENZYME: "Protein that speeds up chemical reactions in cells.",
  MICROSCOPE: "Instrument used to observe cells.",
  BACTERIA: "Very small single-celled organisms.",
  AMOEBA: "Single-celled organism that moves using pseudopodia.",
  PLANTCELL: "Cell with a wall, chloroplasts, and large vacuole.",
  ANIMALCELL: "Cell without a cell wall or chloroplasts.",
  CHROMOSOME: "Thread-like structure carrying genes in the nucleus.",
  DIVIDE: "Process when one cell splits into two new cells.",
};

export const FORCE_CLUES: Record<string, string> = {
  FORCE: "Push or pull that can change motion of an object.",
  PRESSURE: "Force applied over a given area.",
  FRICTION: "Force that opposes motion between surfaces.",
  MOTION: "Change in position of an object over time.",
  PUSH: "Force that moves an object away from you.",
  PULL: "Force that moves an object toward you.",
  LOAD: "Weight or force carried by a structure.",
  THRUST: "Force that pushes an object forward.",
  GRAVITY: "Force that pulls objects toward Earth.",
  FRICTIONAL: "Related to the force that slows moving objects.",
  LUBRICANT: "Substance that reduces friction between surfaces.",
  BALANCE: "Device used to measure mass or weight.",
  WEIGHT: "Force of gravity acting on an object's mass.",
  MASS: "Amount of matter in an object.",
  NEWTON: "Unit used to measure force.",
};

export const FRACTION_CLUES: Record<string, string> = {
  FRACTION: "Number that represents part of a whole.",
  NUMERATOR: "Top number in a fraction.",
  DENOMINATOR: "Bottom number in a fraction.",
  EQUIVALENT: "Fractions that have the same value.",
  HALF: "Fraction equal to one divided by two.",
  QUARTER: "Fraction equal to one divided by four.",
  SIMPLIFY: "Reduce a fraction to its lowest terms.",
  RECIPROCAL: "Fraction flipped so numerator and denominator swap.",
};

export const GRAMMAR_CLUES: Record<string, string> = {
  GRAMMAR: "Rules for using words correctly in sentences.",
  NOUN: "Word that names a person, place, or thing.",
  VERB: "Word that shows an action or state.",
  ADJECTIVE: "Word that describes a noun.",
  PRONOUN: "Word that replaces a noun.",
  TENSE: "Form of a verb showing past, present, or future.",
  ARTICLE: "Word like a, an, or the before a noun.",
  SENTENCE: "Group of words expressing a complete thought.",
  PHRASE: "Small group of words without a complete verb.",
  SPELLING: "Correct arrangement of letters in a word.",
  VOWEL: "Letter A, E, I, O, or U.",
  CONSONANT: "Letter that is not a vowel.",
  ADVERB: "Word that describes a verb or adjective.",
  PREPOSITION: "Word showing position or direction.",
  CONJUNCTION: "Word that joins words or clauses.",
};

/** Merge all topic clue maps; first registration wins for duplicates. */
const ALL_TOPIC_CLUES: Record<string, string> = {
  ...PHOTOSYNTHESIS_CLUES,
  ...CELL_CLUES,
  ...FORCE_CLUES,
  ...FRACTION_CLUES,
  ...GRAMMAR_CLUES,
};

/** Topic name → clue map for strict topic vocabulary. */
export const TOPIC_VOCABULARY: Record<
  string,
  { words: string[]; clues: Record<string, string> }
> = {
  photosynthesis: {
    words: [
      "PLANTS", "LEAVES", "CHLOROPHYLL", "SUNLIGHT", "OXYGEN", "CARBON", "GLUCOSE",
      "STOMATA", "ROOTS", "STEMS", "WATER", "SOIL", "SEEDS", "GREEN", "CHLOROPLAST",
      "XYLEM", "PHLOEM", "STARCH", "SUGAR", "FOOD", "ENERGY", "LIGHT", "MINERAL",
      "NITROGEN", "MESOPHYLL", "EPIDERMIS", "PIGMENT", "RESPIRATION", "SPROUT",
      "GROWTH", "SHADE", "CANOPY", "GUARDCELL", "AUTOTROPH", "TRANSPIRE",
    ],
    clues: PHOTOSYNTHESIS_CLUES,
  },
};

export function getTopicClueMap(topicKey: string): Record<string, string> | null {
  const key = topicKey.toLowerCase().trim();
  for (const [name, entry] of Object.entries(TOPIC_VOCABULARY)) {
    if (key.includes(name) || name.includes(key)) return entry.clues;
  }
  return null;
}

export function getStrictTopicWords(topicText: string): string[] | null {
  const t = topicText.toLowerCase().trim();
  for (const [name, entry] of Object.entries(TOPIC_VOCABULARY)) {
    if (t.includes(name) || name.includes(t)) return entry.words.map((w) => w.toUpperCase());
  }
  return null;
}

export function lookupTopicClue(word: string): string | null {
  const u = String(word || "").toUpperCase();
  return ALL_TOPIC_CLUES[u] ?? null;
}

export function isGenericClueText(clue: string): boolean {
  const c = clue.toLowerCase().trim();
  return (
    c.startsWith("a science term related to") ||
    c.startsWith("a math term related to") ||
    c.startsWith("a english term related to") ||
    c.startsWith("a history term related to") ||
    c.startsWith("a geography term related to") ||
    c.startsWith("a computer term related to") ||
    c === "find this hidden word in the grid." ||
    c.startsWith("find this hidden word") ||
    c.startsWith("search this word") ||
    c === "hidden word" ||
    c === "guess the word" ||
    c === "meaning not available" ||
    /^a term from the student'?s notes/i.test(c)
  );
}
