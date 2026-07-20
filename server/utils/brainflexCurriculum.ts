/**
 * Brain-Flex curriculum libraries: board/grade/subject/topic vocabulary.
 * Generation-only — strict subject isolation, no cross-subject mixing.
 */

import { WORD_SEARCH_CLUES } from "@shared/wordSearchClues";
import {
  lookupTopicClue,
  isGenericClueText,
  PHOTOSYNTHESIS_CLUES,
  getStrictTopicWords,
} from "./brainflexTopicClues";

export type SubjectCategory =
  | "science"
  | "math"
  | "english"
  | "history"
  | "geography"
  | "computer"
  | "general";

export type GradeBand = "very_easy" | "easy" | "intermediate" | "advanced";

export type BoardId = "cbse" | "maharashtra" | "general";

export type TopicEntry = {
  name: string;
  keywords: string[];
  words: string[];
  clues: Record<string, string>;
  cbseExtras?: string[];
  maharashtraExtras?: string[];
};

function norm(s: string | undefined): string {
  return String(s || "").toLowerCase().trim();
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export function parseGrade(className?: string): number | null {
  const s = norm(className);
  if (!s || s.includes("nursery") || s.includes("kg")) return null;
  const m = s.match(/\d+/);
  return m ? Math.min(12, Math.max(1, parseInt(m[0], 10))) : null;
}

export function gradeToBand(grade: number | null): GradeBand {
  if (grade == null || grade <= 3) return "very_easy";
  if (grade <= 5) return "easy";
  if (grade <= 8) return "intermediate";
  return "advanced";
}

export function resolveBoardId(board?: string): BoardId {
  const b = norm(board);
  if (matchesAny(b, ["cbse"])) return "cbse";
  if (matchesAny(b, ["maharashtra", "state board"])) return "maharashtra";
  return "general";
}

export function resolveSubjectCategory(subject?: string): SubjectCategory {
  const s = norm(subject);
  if (!s || s === "brain flex") return "general";
  if (matchesAny(s, ["science", "biology", "physics", "chemistry", "evs", "environment"])) return "science";
  if (matchesAny(s, ["math", "mathematics", "maths"])) return "math";
  if (matchesAny(s, ["english", "grammar", "language", "literature"])) return "english";
  if (matchesAny(s, ["history", "social", "civics", "sst"])) return "history";
  if (matchesAny(s, ["geography", "geo"])) return "geography";
  if (matchesAny(s, ["computer", "coding", "informatics", "it", "cs"])) return "computer";
  return "general";
}

/** Neutral puzzle words — safe when no curriculum focus is set. */
export const NEUTRAL_WORD_BANK: string[] = [
  "PUZZLE", "BRAIN", "FOCUS", "SMART", "THINK", "LEARN", "MEMORY", "PATTERN",
  "LOGIC", "QUIZ", "MIND", "SKILL", "STUDY", "SOLVE", "BRIGHT", "TRAIN",
  "BOOK", "READ", "WRITE", "WORD", "CLASS", "GRADE", "SCIENCE", "ENGLISH",
  "NUMBER", "SHAPES", "COLOUR", "MUSIC", "SPORT", "NATURE", "PLANET", "ENERGY",
  "TEACHER", "STUDENT", "SCHOOL", "FRIEND", "FAMILY", "GARDEN", "ANIMAL", "PLANTS",
  "WATER", "EARTH", "GREEN", "LIGHT", "SOUND", "FORCE", "MOTION", "HEALTH",
];

const SCIENCE_TOPICS: TopicEntry[] = [
  {
    name: "Photosynthesis",
    keywords: ["photosynthesis", "plant", "leaf", "chlorophyll", "stomata", "glucose"],
    words: [
      "PLANTS", "LEAVES", "CHLOROPHYLL", "SUNLIGHT", "OXYGEN", "CARBON", "GLUCOSE",
      "STOMATA", "ROOTS", "STEMS", "WATER", "SOIL", "SEEDS", "GREEN",
      "CHLOROPLAST", "XYLEM", "PHLOEM", "STARCH", "SUGAR", "FOOD", "ENERGY", "LIGHT",
      "MINERAL", "NITROGEN", "MESOPHYLL", "EPIDERMIS", "PIGMENT", "RESPIRATION",
      "SPROUT", "GROWTH", "SHADE", "CANOPY", "GUARDCELL", "AUTOTROPH", "TRANSPIRE",
    ],
    clues: PHOTOSYNTHESIS_CLUES,
  },
  {
    name: "Force and Pressure",
    keywords: ["force", "pressure", "friction", "newton", "thrust", "load"],
    words: [
      "FORCE", "PRESSURE", "FRICTION", "MOTION", "PUSH", "PULL", "LOAD", "THRUST",
      "AREA", "SURFACE", "ROUGH", "SMOOTH", "SLIDE", "GRIP", "DRAG", "BALANCE",
      "WEIGHT", "MASS", "SPRING", "SCALE", "NEWTON", "METER", "SPRINGBALANCE",
      "CONTACT", "NONCONTACT", "MAGNET", "GRAVITY", "FRICTIONAL", "LUBRICANT",
      "STREAMLINED", "AERODYNAMIC", "HYDRAULIC", "PNEUMATIC", "VAULT", "PISTON",
      "ATMOSPHERE", "BAROMETER", "DENSITY", "VOLUME", "DEPTH", "BROAD", "NARROW",
      "SHARP", "BLUNT", "NAIL", "KNIFE", "AXE", "CART", "WHEEL", "BRAKE",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Motion",
    keywords: ["motion", "speed", "velocity", "acceleration", "distance", "time"],
    words: [
      "MOTION", "SPEED", "DISTANCE", "TIME", "REST", "MOVING", "SLOW", "FAST",
      "UNIFORM", "NONUNIFORM", "AVERAGE", "INSTANT", "GRAPH", "PLOT", "AXIS",
      "METRE", "SECOND", "HOUR", "KILOMETRE", "VELOCITY", "ACCELERATION",
      "DECELERATION", "CIRCULAR", "PERIODIC", "OSCILLATORY", "LINEAR", "CURVED",
      "ROTATION", "REVOLUTION", "ORBIT", "PENDULUM", "SWING", "VIBRATE", "STOP",
      "START", "CHANGE", "DIRECTION", "PATH", "TRACK", "RACE", "JOURNEY", "TRIP",
      "ODOMETER", "SPEEDOMETER", "STOPWATCH", "TIMER", "MEASURE", "RECORD",
      "COMPARE", "CALCULATE", "FORMULA", "RATIO", "UNIT", "CONVERT",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Cell",
    keywords: ["cell", "tissue", "organ", "nucleus", "cytoplasm", "membrane"],
    words: [
      "CELL", "TISSUE", "ORGAN", "NUCLEUS", "CYTOPLASM", "MEMBRANE", "WALL",
      "VACUOLE", "MITOCHONDRIA", "CHLOROPLAST", "RIBOSOME", "GENE", "DNA",
      "PROTEIN", "ENZYME", "UNICELLULAR", "MULTICELLULAR", "ORGANISM", "LIVING",
      "DEAD", "MICROSCOPE", "SLIDE", "STAIN", "ONION", "CHEEK", "BACTERIA",
      "AMOEBA", "PROTOZOA", "PLANTCELL", "ANIMALCELL", "MERISTEM", "EPIDERMIS",
      "XYLEM", "PHLOEM", "ROOTHAIR", "STOMATA", "GUARD", "CHROMOSOME", "DIVIDE",
      "GROWTH", "REPAIR", "DIGEST", "ABSORB", "TRANSPORT", "RESPIRE", "EXCRETE",
      "SENSE", "REPRODUCE", "LIFE", "BODY", "SYSTEM", "STRUCTURE", "FUNCTION",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Electricity",
    keywords: ["electric", "electricity", "circuit", "current", "voltage", "resistance"],
    words: [
      "ELECTRIC", "CURRENT", "VOLTAGE", "CIRCUIT", "BATTERY", "CELL", "WIRE",
      "BULB", "SWITCH", "FUSE", "RESISTOR", "CONDUCTOR", "INSULATOR", "CHARGE",
      "POSITIVE", "NEGATIVE", "TERMINAL", "SERIES", "PARALLEL", "OPEN", "CLOSED",
      "FLOW", "POWER", "ENERGY", "WATT", "AMPERE", "OHM", "SHORT", "SHOCK",
      "SAFETY", "EARTHING", "PLUG", "SOCKET", "MOTOR", "GENERATOR", "DYNAMO",
      "MAGNET", "FIELD", "COMPASS", "POLE", "NORTH", "SOUTH", "ATTRACT", "REPEL",
      "ELECTROMAGNET", "BELL", "BUZZER", "HEATER", "FAN", "LAMP", "LED", "TORCH",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Reproduction",
    keywords: ["reproduction", "reproductive", "pollination", "fertilisation", "seed"],
    words: [
      "REPRODUCTION", "ASEXUAL", "SEXUAL", "POLLINATION", "FERTILISATION", "SEED",
      "SPERM", "OVULE", "EMBRYO", "OFFSPRING", "PARENT", "GENERATION", "BUDDING",
      "FRAGMENT", "SPORE", "BUD", "RUNNER", "GRAFTING", "LAYERING", "CUTTING",
      "STAMEN", "PISTIL", "ANther", "STIGMA", "STYLE", "OVARY", "PETAL", "SEPAL",
      "FLOWER", "FRUIT", "DISPERSAL", "WIND", "WATER", "ANIMAL", "EXPLOSION",
      "GERMINATION", "SEEDLING", "LIFE", "CYCLE", "STAGE", "LARVA", "PUPA",
      "METAMORPHOSIS", "MAMMAL", "BIRD", "REPTILE", "FISH", "INSECT", "YOUNG",
      "HATCH", "BIRTH", "NURTURE", "CARE", "GROW", "MATURE", "DEVELOP",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
];

const MATH_TOPICS: TopicEntry[] = [
  {
    name: "Fractions",
    keywords: ["fraction", "numerator", "denominator", "equivalent", "proper", "improper"],
    words: [
      "FRACTION", "NUMERATOR", "DENOMINATOR", "EQUIVALENT", "PROPER", "IMPROPER",
      "MIXED", "WHOLE", "PART", "HALF", "THIRD", "QUARTER", "FIFTH", "SIXTH",
      "EIGHTH", "TENTH", "TWELFTH", "SIMPLEST", "REDUCE", "EXPAND", "COMPARE",
      "ORDER", "ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "RECIPROCAL", "UNIT",
      "LIKE", "UNLIKE", "COMMON", "LOWEST", "HIGHEST", "SIMPLIFY", "CONVERT",
      "DECIMAL", "PERCENT", "RATIO", "SHARE", "PIZZA", "CAKE", "SLICE", "PIECE",
      "REMAINDER", "QUOTIENT", "PRODUCT", "SUM", "DIFFERENCE", "EQUAL", "UNEQUAL",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Algebra",
    keywords: ["algebra", "variable", "expression", "equation", "linear"],
    words: [
      "ALGEBRA", "VARIABLE", "EXPRESSION", "EQUATION", "TERM", "COEFFICIENT",
      "CONSTANT", "UNKNOWN", "FORMULA", "FORMULATE", "SOLVE", "BALANCE", "LHS",
      "RHS", "EQUAL", "LINEAR", "SIMPLE", "COMPLEX", "BRACKET", "EXPAND",
      "FACTOR", "SUBSTITUTE", "VALUE", "CHECK", "VERIFY", "PATTERN", "RULE",
      "SEQUENCE", "GENERAL", "FORM", "TRIAL", "ERROR", "GUESS", "TABLE",
      "GRAPH", "POINT", "LINE", "SLOPE", "INTERCEPT", "AXIS", "ORIGIN", "PLOT",
      "COORDINATE", "PAIR", "ORDERED", "RELATION", "FUNCTION", "INPUT", "OUTPUT",
      "MAPPING", "DOMAIN", "RANGE", "IDENTITY", "INVERSE", "OPERATION", "ADDITION",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Geometry",
    keywords: ["geometry", "angle", "triangle", "circle", "polygon", "area", "perimeter"],
    words: [
      "GEOMETRY", "ANGLE", "TRIANGLE", "CIRCLE", "SQUARE", "RECTANGLE", "POLYGON",
      "SIDE", "VERTEX", "EDGE", "FACE", "POINT", "LINE", "SEGMENT", "RAY",
      "PARALLEL", "PERPENDICULAR", "INTERSECT", "ACUTE", "OBTUSE", "RIGHT",
      "STRAIGHT", "REFLEX", "COMPLEMENT", "SUPPLEMENT", "CONGRUENT", "SIMILAR",
      "SYMMETRY", "AXIS", "MIRROR", "ROTATION", "TRANSLATION", "REFLECTION",
      "DIAMETER", "RADIUS", "CHORD", "ARC", "SECTOR", "SEGMENT", "CIRCUMFERENCE",
      "AREA", "PERIMETER", "VOLUME", "SURFACE", "CUBE", "CUBOID", "CYLINDER",
      "CONE", "SPHERE", "PRISM", "PYRAMID", "NET", "DIAGONAL", "MIDPOINT",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Ratio",
    keywords: ["ratio", "proportion", "share", "compare"],
    words: [
      "RATIO", "PROPORTION", "SHARE", "COMPARE", "PART", "WHOLE", "EQUIVALENT",
      "SIMPLEST", "FORM", "UNITARY", "METHOD", "SCALE", "MAP", "MODEL", "DRAWING",
      "ENLARGE", "REDUCE", "FACTOR", "MULTIPLY", "DIVIDE", "CROSS", "PRODUCT",
      "MEAN", "EXTREME", "CONTINUED", "DIRECT", "INVERSE", "VARIATION", "RELATE",
      "QUANTITY", "AMOUNT", "NUMBER", "FRACTION", "PERCENT", "DECIMAL", "CONVERT",
      "MIXTURE", "ALLOY", "BLEND", "COMBINE", "SPLIT", "DISTRIBUTE", "FAIR",
      "UNFAIR", "BALANCE", "EQUAL", "UNEQUAL", "GREATER", "LESSER", "ORDER",
      "ARRANGE", "TABLE", "GRAPH", "BAR", "PIE", "CHART", "DATA", "RECORD",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Percentage",
    keywords: ["percent", "percentage", "profit", "loss", "discount", "interest"],
    words: [
      "PERCENT", "PERCENTAGE", "FRACTION", "DECIMAL", "CONVERT", "INCREASE",
      "DECREASE", "PROFIT", "LOSS", "DISCOUNT", "MARKED", "SELLING", "COST",
      "PRICE", "AMOUNT", "VALUE", "CHANGE", "DIFFERENCE", "ORIGINAL", "FINAL",
      "INTEREST", "SIMPLE", "COMPOUND", "PRINCIPAL", "RATE", "TIME", "YEAR",
      "MONTH", "DAY", "CALCULATE", "FIND", "FORMULA", "EQUATION", "PROBLEM",
      "SHARE", "PART", "WHOLE", "TOTAL", "SUM", "REMAIN", "LEFT", "SPENT",
      "SAVE", "EARN", "GAIN", "LOSS", "BREAK", "EVEN", "MARGIN", "COMMISSION",
      "TAX", "GST", "VAT", "BILL", "RECEIPT", "PAY", "RECEIVE", "BALANCE",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
];

const ENGLISH_TOPICS: TopicEntry[] = [
  {
    name: "Grammar",
    keywords: ["grammar", "sentence", "phrase", "clause", "speech"],
    words: [
      "GRAMMAR", "SENTENCE", "PHRASE", "CLAUSE", "NOUN", "VERB", "ADJECTIVE",
      "ADVERB", "PRONOUN", "PREPOSITION", "CONJUNCTION", "INTERJECTION",
      "ARTICLE", "DETERMINER", "MODIFIER", "COMPLEMENT", "OBJECT", "SUBJECT",
      "PREDICATE", "STRUCTURE", "RULE", "CORRECT", "ERROR", "MISTAKE", "FIX",
      "PUNCTUATION", "COMMA", "FULLSTOP", "QUESTION", "EXCLAIM", "CAPITAL",
      "SPELLING", "VOWEL", "CONSONANT", "SYLLABLE", "STRESS", "ACCENT",
      "FORMAL", "INFORMAL", "REGISTER", "TONE", "STYLE", "CLARITY", "ACCURACY",
      "USAGE", "STANDARD", "DIALECT", "MEANING", "CONTEXT", "EXAMPLE", "PRACTICE",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Pronouns",
    keywords: ["pronoun", "reflexive", "possessive", "demonstrative", "relative"],
    words: [
      "PRONOUN", "PERSONAL", "POSSESSIVE", "REFLEXIVE", "EMPHATIC", "DEMONSTRATIVE",
      "INTERROGATIVE", "RELATIVE", "INDEFINITE", "RECIPROCAL", "DISTRIBUTIVE",
      "SUBJECT", "OBJECT", "GENDER", "NUMBER", "PERSON", "FIRST", "SECOND",
      "THIRD", "SINGULAR", "PLURAL", "REPLACE", "NOUN", "ANTECEDENT", "REFER",
      "AGREEMENT", "MATCH", "CORRECT", "USAGE", "SENTENCE", "CLAUSE", "PHRASE",
      "EXAMPLE", "PRACTICE", "IDENTIFY", "CLASSIFY", "TYPE", "KIND", "FORM",
      "CASE", "NOMINATIVE", "ACCUSATIVE", "GENITIVE", "MINE", "YOURS", "THEIRS",
      "OURSELVES", "YOURSELF", "ITSELF", "WHO", "WHOM", "WHOSE", "WHICH", "THAT",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Tenses",
    keywords: ["tense", "past", "present", "future", "perfect", "continuous"],
    words: [
      "TENSE", "PRESENT", "PAST", "FUTURE", "SIMPLE", "CONTINUOUS", "PERFECT",
      "PROGRESSIVE", "PERFECTIVE", "FORM", "VERB", "AUXILIARY", "MAIN", "HELPING",
      "TIME", "ACTION", "STATE", "HABIT", "ROUTINE", "EVENT", "MOMENT", "DURATION",
      "COMPLETED", "ONGOING", "PLANNED", "INTENTION", "PREDICTION", "REGULAR",
      "IRREGULAR", "BASE", "INFINITIVE", "PARTICIPLE", "GERUND", "CONJUGATE",
      "CHANGE", "SPELLING", "RULE", "EXCEPTION", "NEGATIVE", "QUESTION", "AFFIRM",
      "SIGNAL", "WORD", "YESTERDAY", "TOMORROW", "ALWAYS", "NEVER", "OFTEN",
      "SOMETIMES", "NOW", "THEN", "SOON", "LATER", "BEFORE", "AFTER", "WHILE",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Vocabulary",
    keywords: ["vocabulary", "synonym", "antonym", "word", "meaning", "prefix", "suffix"],
    words: [
      "VOCABULARY", "WORD", "MEANING", "SYNONYM", "ANTONYM", "HOMOPHONE", "HOMONYM",
      "PREFIX", "SUFFIX", "ROOT", "ORIGIN", "LATIN", "GREEK", "DERIVE", "FORM",
      "SPELLING", "PRONOUNCE", "SPEAK", "READ", "WRITE", "CONTEXT", "CLUE", "GUESS",
      "DICTIONARY", "THESAURUS", "GLOSSARY", "ENTRY", "DEFINITION", "EXAMPLE",
      "USAGE", "FORMAL", "INFORMAL", "REGISTER", "EXPRESS", "COMMUNICATE", "IDEA",
      "THOUGHT", "FEELING", "DESCRIBE", "EXPLAIN", "DEFINE", "COMPARE", "CONTRAST",
      "RELATE", "CONNECT", "EXPAND", "ENRICH", "LEARN", "MEMORISE", "RECALL",
      "REVIEW", "PRACTICE", "QUIZ", "TEST", "MASTER", "BUILD", "GROW", "IMPROVE",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
];

const HISTORY_TOPICS: TopicEntry[] = [
  {
    name: "Freedom Movement",
    keywords: ["freedom", "independence", "gandhi", "revolt", "nationalism", "colonial"],
    words: [
      "FREEDOM", "INDEPENDENCE", "NATIONALISM", "COLONIAL", "BRITISH", "EMPIRE",
      "REVOLT", "MUTINY", "PROTEST", "MARCH", "STRIKE", "BOYCOTT", "SATYAGRAHA",
      "NONVIOLENCE", "CIVIL", "DISOBEDIENCE", "LEADER", "MOVEMENT", "PARTY",
      "CONGRESS", "UNION", "FLAG", "NATION", "PATRIOT", "HERO", "MARTYR",
      "STRUGGLE", "SACRIFICE", "UNITY", "DIVIDE", "PARTITION", "REPUBLIC",
      "CONSTITUTION", "DEMOCRACY", "RIGHTS", "DUTY", "CITIZEN", "VOTE", "ELECT",
      "GOVERN", "RULE", "LAW", "JUSTICE", "EQUALITY", "LIBERTY", "FRATERNITY",
      "HERITAGE", "LEGACY", "MEMORY", "MONUMENT", "MUSEUM", "ARCHIVE", "SOURCE",
    ].map((w) => w.toUpperCase()),
    clues: {},
    cbseExtras: ["SWADESHI", "KHADI", "CHARKHA", "DANDI", "JALLIANWALA"],
  },
  {
    name: "Ancient India",
    keywords: ["ancient", "harappa", "maurya", "gupta", "vedic", "civilization"],
    words: [
      "ANCIENT", "CIVILIZATION", "HARAPPA", "MOHENJO", "INDUS", "VALLEY", "SEAL",
      "DRAIN", "GRANARY", "GREAT", "BATH", "SCRIPT", "ARTIFACT", "ARCHAEOLOGY",
      "EXCAVATE", "SITE", "CITY", "TOWN", "VILLAGE", "TRADE", "ROUTE", "COTTON",
      "WHEAT", "BARLEY", "POTTERY", "BRONZE", "COPPER", "IRON", "TOOL", "WEAPON",
      "MAURYA", "ASHOKA", "EMPIRE", "KING", "DYNASTY", "GUpta", "GOLDEN", "AGE",
      "ART", "LITERATURE", "SCIENCE", "MATH", "ASTRONOMY", "MEDICINE", "RELIGION",
      "BUDDHISM", "JAINISM", "HINDUISM", "TEMPLE", "STUPA", "PILLAR", "EDICT",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Medieval India",
    keywords: ["medieval", "sultan", "mughal", "delhi", "kingdom", "dynasty"],
    words: [
      "MEDIEVAL", "SULTAN", "MUghal", "DELHI", "KINGDOM", "DYNASTY", "EMPIRE",
      "RULER", "THRONE", "COURT", "NOBLE", "VASSAL", "FEUDAL", "FORT", "PALACE",
      "MINARET", "DOME", "ARCH", "MOSQUE", "TOMB", "GARDEN", "FORTRESS", "SIEGE",
      "BATTLE", "WAR", "CONQUEST", "EXPANSION", "ADMINISTRATION", "REVENUE",
      "TAX", "LAND", "GRANT", "JAGIR", "ZAMINDAR", "PEASANT", "ARTISAN", "TRADER",
      "ROUTE", "CARAVAN", "SPICE", "SILK", "CULTURE", "BLEND", "SYNCretism",
      "LITERATURE", "POETRY", "MUSIC", "DANCE", "PAINTING", "ARCHITECTURE",
      "PATRON", "ARTIST", "SCHOLAR", "UNIVERSITY", "LIBRARY", "MANUSCRIPT",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
];

const GEOGRAPHY_TOPICS: TopicEntry[] = [
  {
    name: "Climate",
    keywords: ["climate", "weather", "rainfall", "monsoon", "temperature", "season"],
    words: [
      "CLIMATE", "WEATHER", "TEMPERATURE", "RAINFALL", "MONSOON", "SEASON",
      "SUMMER", "WINTER", "SPRING", "AUTUMN", "HUMID", "DRY", "WET", "COLD",
      "HOT", "WARM", "COOL", "FREEZE", "MELT", "EVAPORATE", "CONDENSE",
      "PRECIPITATION", "DEW", "FOG", "MIST", "CLOUD", "WIND", "BREEZE", "GALE",
      "STORM", "CYCLONE", "HURRICANE", "TYPHOON", "DROUGHT", "FLOOD", "FAMINE",
      "CROP", "HARVEST", "AGRICULTURE", "IRRIGATION", "REGION", "ZONE", "TROPICAL",
      "TEMPERATE", "POLAR", "ARID", "SEMIARID", "HUMIDITY", "PRESSURE", "FRONT",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Rivers",
    keywords: ["river", "stream", "delta", "tributary", "basin", "floodplain"],
    words: [
      "RIVER", "STREAM", "CREEK", "BROOK", "TRIBUTARY", "DELTA", "ESTUARY", "MOUTH",
      "SOURCE", "SPRING", "GLACIER", "SNOW", "MELT", "BASIN", "WATERSHED",
      "CATCHMENT", "FLOODPLAIN", "MEANDER", "BRAID", "CHANNEL", "BANK", "BED",
      "CURRENT", "FLOW", "VELOCITY", "VOLUME", "DISCHARGE", "SEDIMENT", "EROSION",
      "DEPOSITION", "ALLUVIAL", "FERTILE", "IRRIGATION", "CANAL", "DAM", "RESERVOIR",
      "HYDRO", "POWER", "NAVIGATION", "TRANSPORT", "BRIDGE", "FERRY", "CROSSING",
      "FISH", "AQUATIC", "ECOSYSTEM", "POLLUTION", "CONSERVE", "PROTECT", "CLEAN",
    ].map((w) => w.toUpperCase()),
    clues: {},
    maharashtraExtras: ["GODAVARI", "KRISHNA", "TAPI", "NARMADA"],
  },
  {
    name: "Mountains",
    keywords: ["mountain", "hill", "plateau", "peak", "range", "valley"],
    words: [
      "MOUNTAIN", "HILL", "PEAK", "SUMMIT", "RANGE", "VALLEY", "PLATEAU", "PLAIN",
      "SLOPE", "RIDGE", "PASS", "GLACIER", "SNOW", "ROCK", "BOULDER", "CLIFF",
      "CANYON", "GORGE", "VOLCANO", "CRATER", "LAVA", "ERUPT", "EARTHQUAKE",
      "FOLD", "FAULT", "PLATE", "TECTONIC", "UPLIFT", "EROSION", "WEATHERING",
      "ALTITUDE", "ELEVATION", "HEIGHT", "TREELINE", "SNOWLINE", "FOREST", "MEADOW",
      "PASTURE", "TERRACE", "FARMING", "MINING", "QUARRY", "TOURISM", "TREK",
      "CLIMB", "CAMP", "SHELTER", "HIMALAYA", "ALPS", "ANDES", "ROCKY", "BLOCK",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
  {
    name: "Maps",
    keywords: ["map", "globe", "scale", "legend", "compass", "atlas"],
    words: [
      "MAP", "GLOBE", "ATLAS", "CHART", "SCALE", "LEGEND", "KEY", "SYMBOL",
      "COMPASS", "DIRECTION", "NORTH", "SOUTH", "EAST", "WEST", "BEARING",
      "LATITUDE", "LONGITUDE", "EQUATOR", "MERIDIAN", "PARALLEL", "TROPIC",
      "POLAR", "HEMISPHERE", "CONTINENT", "OCEAN", "COUNTRY", "STATE", "DISTRICT",
      "CITY", "TOWN", "VILLAGE", "CAPITAL", "BORDER", "BOUNDARY", "REGION",
      "PHYSICAL", "POLITICAL", "THEMATIC", "TOPOGRAPHIC", "CONTOUR", "ELEVATION",
      "GRID", "COORDINATE", "LOCATE", "PLOT", "MEASURE", "DISTANCE", "AREA",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
];

const COMPUTER_TOPICS: TopicEntry[] = [
  {
    name: "Programming",
    keywords: ["code", "program", "python", "algorithm", "coding", "software"],
    words: [
      "COMPUTER", "PROGRAM", "CODE", "CODING", "PYTHON", "ALGORITHM", "LOGIC",
      "VARIABLE", "INPUT", "OUTPUT", "DATA", "BINARY", "MEMORY", "STORAGE",
      "KEYBOARD", "MONITOR", "MOUSE", "PRINTER", "SCANNER", "INTERNET", "NETWORK",
      "SERVER", "CLIENT", "BROWSER", "WEBSITE", "SOFTWARE", "HARDWARE", "CPU",
      "RAM", "ROM", "DISK", "FILE", "FOLDER", "SAVE", "OPEN", "RUN", "DEBUG",
      "ERROR", "LOOP", "CONDITION", "FUNCTION", "STRING", "INTEGER", "BOOLEAN",
      "ARRAY", "LIST", "INDEX", "ITERATE", "RECURSE", "COMPILE", "EXECUTE",
    ].map((w) => w.toUpperCase()),
    clues: {},
  },
];

export const SUBJECT_TOPIC_MAP: Record<Exclude<SubjectCategory, "general">, TopicEntry[]> = {
  science: SCIENCE_TOPICS,
  math: MATH_TOPICS,
  english: ENGLISH_TOPICS,
  history: HISTORY_TOPICS,
  geography: GEOGRAPHY_TOPICS,
  computer: COMPUTER_TOPICS,
};

function resolveClueForWord(word: string, topic: TopicEntry): string | null {
  const key = word.toUpperCase();
  if (topic.clues[key]) return topic.clues[key]!;
  const topicSpecific = lookupTopicClue(key);
  if (topicSpecific) return topicSpecific;
  // Curated map only — do not use programmatic getWordSearchClue fallback here
  // (that would loosen word-selection validation for every curriculum token).
  const curated = WORD_SEARCH_CLUES[key];
  if (curated && !isGenericClueText(curated)) return curated;
  return null;
}

/** Explicit topic/subject clues only — never generic placeholders. */
const CURRICULUM_CLUES: Record<string, string> = {};

function registerTopicClues(topics: TopicEntry[]) {
  for (const topic of topics) {
    const allWords = [...topic.words, ...(topic.cbseExtras ?? []), ...(topic.maharashtraExtras ?? [])];
    for (const w of allWords) {
      const key = w.toUpperCase();
      if (CURRICULUM_CLUES[key]) continue;
      const clue = resolveClueForWord(key, topic);
      if (clue) CURRICULUM_CLUES[key] = clue;
    }
    Object.assign(CURRICULUM_CLUES, topic.clues);
  }
}

for (const [, topics] of Object.entries(SUBJECT_TOPIC_MAP) as Array<
  [Exclude<SubjectCategory, "general">, TopicEntry[]]
>) {
  registerTopicClues(topics);
}

export function getCurriculumClue(word: string): string | null {
  const clue = CURRICULUM_CLUES[String(word || "").toUpperCase()] ?? null;
  if (clue && isGenericClueText(clue)) return null;
  return clue;
}

export function registerCurriculumClues(clues: Record<string, string>) {
  for (const [w, c] of Object.entries(clues)) {
    CURRICULUM_CLUES[w.toUpperCase()] = c;
  }
}

function matchTopic(topic: TopicEntry, subject: string, topicText: string): boolean {
  const blob = `${subject} ${topicText}`;
  return topic.keywords.some((k) => blob.includes(k));
}

function boardExtras(topic: TopicEntry, board: BoardId): string[] {
  if (board === "cbse") return topic.cbseExtras ?? [];
  if (board === "maharashtra") return topic.maharashtraExtras ?? [];
  return [];
}

export type CurriculumResolveInput = {
  board?: string;
  grade?: string;
  subject?: string;
  topic?: string;
};

/** Resolve strict subject/topic word pool — never mixes subjects. */
export function resolveCurriculumWordPool(input: CurriculumResolveInput): string[] {
  const subjectCat = resolveSubjectCategory(input.subject);
  const topicText = norm(input.topic);
  const board = resolveBoardId(input.board);

  if (subjectCat === "general" && !topicText) {
    return [...NEUTRAL_WORD_BANK];
  }

  if (subjectCat === "general" && topicText) {
    // Topic without subject: find best matching topic across all subjects
    for (const topics of Object.values(SUBJECT_TOPIC_MAP)) {
      for (const t of topics) {
        if (matchTopic(t, "", topicText)) {
          return dedupeWords([...t.words, ...boardExtras(t, board)]);
        }
      }
    }
    return [...NEUTRAL_WORD_BANK];
  }

  const topics = SUBJECT_TOPIC_MAP[subjectCat];
  if (!topics) return [...NEUTRAL_WORD_BANK];

  // Specific topic within subject — strict topic-only vocabulary
  if (topicText) {
    const strictWords = getStrictTopicWords(topicText);
    if (strictWords?.length) {
      return dedupeWords(strictWords);
    }
    for (const t of topics) {
      if (matchTopic(t, norm(input.subject), topicText)) {
        return dedupeWords([...t.words, ...boardExtras(t, board)]);
      }
    }
    // Topic text provided but no match — do not fall back to full subject
    return [];
  }

  // Subject only: union of all topics in that subject (still strict — no cross-subject)
  const all: string[] = [];
  for (const t of topics) {
    all.push(...t.words, ...boardExtras(t, board));
  }
  return dedupeWords(all);
}

function dedupeWords(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const u = w.toUpperCase().replace(/[^A-Z]/g, "");
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

export function getGradeWordLimits(band: GradeBand): { minLen: number; maxLen: number; crosswordMax: number } {
  switch (band) {
    case "very_easy":
      return { minLen: 4, maxLen: 6, crosswordMax: 6 };
    case "easy":
      return { minLen: 4, maxLen: 7, crosswordMax: 7 };
    case "intermediate":
      return { minLen: 4, maxLen: 9, crosswordMax: 8 };
    case "advanced":
      return { minLen: 4, maxLen: 12, crosswordMax: 10 };
  }
}
