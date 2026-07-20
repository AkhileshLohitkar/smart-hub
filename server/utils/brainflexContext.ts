/**
 * Brain-Flex generation context: board/grade/subject/topic + entropy helpers.
 * Generation-only — no UI impact.
 */

import {
  type GradeBand,
  type SubjectCategory,
  gradeToBand,
  parseGrade,
  resolveBoardId,
  resolveSubjectCategory,
} from "./brainflexCurriculum";
import { seededShuffle } from "./brainflexUniqueness";
import { buildRiddlesFromKnowledge, buildTeasersFromKnowledge } from "./brainflexKnowledge";

export type BrainFlexContext = {
  board?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  /** Words used in recent generations for this user (uppercase). */
  excludeWords?: string[];
  /** Normalized riddle questions recently used. */
  excludeRiddles?: string[];
  /** Normalized brain teaser questions recently used. */
  excludeBrainTeasers?: string[];
  /**
   * Condensed matching My Notes text for this user (optional enrichment).
   * Only set when Curriculum Focus is present and notes match.
   */
  notesContext?: string;
  /** Vocabulary tokens extracted from matching My Notes (optional). */
  notesVocab?: string[];
  /** Unified knowledge object — single source of truth for all activities in one worksheet. */
  knowledge?: import("./brainflexKnowledge").BrainFlexKnowledgeObject;
  /** Per-generation entropy — changes shuffle/pick order each attempt. */
  generationSeed?: number;
  /** Retry attempt index (0-based) for stronger variation on duplicates. */
  generationAttempt?: number;
  /** Slight difficulty variation within the same grade band. */
  difficultyHint?: "easy" | "medium" | "challenging";
};

export function getContextGradeBand(ctx?: BrainFlexContext): GradeBand {
  return gradeToBand(parseGrade(ctx?.grade));
}

export function getContextSubject(ctx?: BrainFlexContext): SubjectCategory {
  return resolveSubjectCategory(ctx?.subject);
}

export function getContextBoard(ctx?: BrainFlexContext): string {
  const id = resolveBoardId(ctx?.board);
  if (id === "cbse") return "CBSE";
  if (id === "maharashtra") return "Maharashtra State Board";
  return ctx?.board ?? "";
}

/** Fisher–Yates shuffle (unbiased vs sort-random). */
export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function norm(s: string | undefined): string {
  return String(s || "").toLowerCase().trim();
}

function normQuestion(q: string): string {
  return norm(q).replace(/\s+/g, " ");
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export function isGenericBrainFlexSubject(subject?: string): boolean {
  const s = norm(subject);
  return !s || s === "brain flex";
}

export type RiddleEntry = {
  question: string;
  answer: string;
  subjects?: SubjectCategory[];
  topics?: string[];
  minBand?: GradeBand;
};

const GRADE_BAND_ORDER: GradeBand[] = ["very_easy", "easy", "intermediate", "advanced"];

function bandAtLeast(current: GradeBand, min: GradeBand): boolean {
  return GRADE_BAND_ORDER.indexOf(current) >= GRADE_BAND_ORDER.indexOf(min);
}

export const SCIENCE_RIDDLES: RiddleEntry[] = [
  { question: "I am green and use sunlight to make food. What am I?", answer: "A leaf", subjects: ["science"], topics: ["photosynthesis", "plant"] },
  { question: "Plants breathe out this gas that humans need.", answer: "Oxygen", subjects: ["science"], topics: ["photosynthesis"] },
  { question: "I am the green pigment in leaves.", answer: "Chlorophyll", subjects: ["science"], topics: ["photosynthesis", "plant"] },
  { question: "Tiny pores on leaves for gas exchange.", answer: "Stomata", subjects: ["science"], topics: ["photosynthesis", "plant"] },
  { question: "Plants store food as this sugar.", answer: "Glucose", subjects: ["science"], topics: ["photosynthesis"] },
  { question: "I pull a cart but am not alive. What force slows me?", answer: "Friction", subjects: ["science"], topics: ["force", "friction"] },
  { question: "Push or pull — what am I?", answer: "Force", subjects: ["science"], topics: ["force", "pressure"] },
  { question: "I measure how fast something moves.", answer: "Speed", subjects: ["science"], topics: ["motion", "speed"] },
  { question: "The brain of the cell.", answer: "Nucleus", subjects: ["science"], topics: ["cell"] },
  { question: "I produce energy in cells.", answer: "Mitochondria", subjects: ["science"], topics: ["cell"] },
  { question: "Current flows through me in a circuit.", answer: "Wire", subjects: ["science"], topics: ["electric", "circuit"] },
  { question: "I store chemical energy for a torch.", answer: "Battery", subjects: ["science"], topics: ["electric", "electricity"] },
  { question: "Bees help flowers with this process.", answer: "Pollination", subjects: ["science"], topics: ["reproduction", "flower"] },
  { question: "A seed grows into this young plant.", answer: "Seedling", subjects: ["science"], topics: ["reproduction", "seed"] },
  { question: "I have roots, stem, and leaves but cannot walk.", answer: "A plant", subjects: ["science"], topics: ["plant", "photosynthesis"] },
];

export const MATH_RIDDLES: RiddleEntry[] = [
  { question: "Top number of a fraction — what am I?", answer: "Numerator", subjects: ["math"], topics: ["fraction"] },
  { question: "Bottom number of a fraction — what am I?", answer: "Denominator", subjects: ["math"], topics: ["fraction"] },
  { question: "I show two equal quantities with an equals sign.", answer: "Equation", subjects: ["math"], topics: ["algebra", "equation"] },
  { question: "I stand for an unknown value.", answer: "Variable", subjects: ["math"], topics: ["algebra"] },
  { question: "Three sides and three angles — what shape am I?", answer: "Triangle", subjects: ["math"], topics: ["geometry"] },
  { question: "All points are the same distance from my centre.", answer: "Circle", subjects: ["math"], topics: ["geometry", "circle"] },
  { question: "I compare two quantities.", answer: "Ratio", subjects: ["math"], topics: ["ratio"] },
  { question: "Out of one hundred — what type of number am I?", answer: "Percent", subjects: ["math"], topics: ["percent", "percentage"] },
  { question: "Half of half is what fraction?", answer: "One quarter", subjects: ["math"], topics: ["fraction"], minBand: "easy" },
  { question: "I have four equal sides and four right angles.", answer: "Square", subjects: ["math"], topics: ["geometry"] },
];

export const ENGLISH_RIDDLES: RiddleEntry[] = [
  { question: "A word that names a person, place, or thing.", answer: "Noun", subjects: ["english"], topics: ["grammar", "noun"] },
  { question: "A word that shows action.", answer: "Verb", subjects: ["english"], topics: ["grammar", "verb"] },
  { question: "I describe a noun — what part of speech am I?", answer: "Adjective", subjects: ["english"], topics: ["grammar", "adjective"] },
  { question: "I replace a noun — what am I?", answer: "Pronoun", subjects: ["english"], topics: ["pronoun", "grammar"] },
  { question: "Past, present, or future — I show time in a verb.", answer: "Tense", subjects: ["english"], topics: ["tense", "grammar"] },
  { question: "Letters A, E, I, O, U — what are we?", answer: "Vowels", subjects: ["english"], topics: ["vocabulary", "grammar"] },
  { question: "I mean the same as another word.", answer: "Synonym", subjects: ["english"], topics: ["vocabulary"] },
  { question: "I mean the opposite of another word.", answer: "Antonym", subjects: ["english"], topics: ["vocabulary"] },
  { question: "I have words but never speak.", answer: "A book", subjects: ["english"], topics: ["reading", "vocabulary"] },
  { question: "A group of words that expresses a complete thought.", answer: "Sentence", subjects: ["english"], topics: ["grammar"] },
];

export const HISTORY_RIDDLES: RiddleEntry[] = [
  { question: "I am a peaceful refusal to obey unfair laws.", answer: "Satyagraha", subjects: ["history"], topics: ["freedom", "gandhi"] },
  { question: "India became free in this year.", answer: "1947", subjects: ["history"], topics: ["freedom", "independence"] },
  { question: "Ancient city of the Indus Valley Civilization.", answer: "Harappa", subjects: ["history"], topics: ["ancient", "harappa"] },
  { question: "A ruler of an empire.", answer: "Emperor", subjects: ["history"], topics: ["medieval", "empire"] },
  { question: "An uprising against authority.", answer: "Revolt", subjects: ["history"], topics: ["freedom", "revolt"] },
  { question: "Customs passed down through generations.", answer: "Tradition", subjects: ["history"], topics: ["culture", "heritage"] },
];

export const GEOGRAPHY_RIDDLES: RiddleEntry[] = [
  { question: "I show places on paper.", answer: "Map", subjects: ["geography"], topics: ["map"] },
  { question: "Seasonal wind that brings rain to India.", answer: "Monsoon", subjects: ["geography"], topics: ["climate", "monsoon"] },
  { question: "A long body of flowing water.", answer: "River", subjects: ["geography"], topics: ["river"] },
  { question: "Very high land with peaks.", answer: "Mountain", subjects: ["geography"], topics: ["mountain"] },
  { question: "Distance north or south of the equator.", answer: "Latitude", subjects: ["geography"], topics: ["map", "globe"] },
  { question: "The usual weather of a place over many years.", answer: "Climate", subjects: ["geography"], topics: ["climate"] },
];

export const GENERAL_RIDDLES: RiddleEntry[] = [
  { question: "What has keys but can't open locks?", answer: "Keyboard" },
  { question: "What has a neck but no head?", answer: "Bottle" },
  { question: "What gets wetter as it dries?", answer: "Towel" },
  { question: "What has hands but cannot clap?", answer: "Clock" },
  { question: "What runs but never walks?", answer: "Water" },
  { question: "What has an eye but cannot see?", answer: "Needle" },
  { question: "What can travel around the world while staying in a corner?", answer: "A stamp" },
  { question: "What has to be broken before you can use it?", answer: "An egg" },
  { question: "The more you take, the more you leave behind. What are they?", answer: "Footsteps" },
  { question: "What begins with T, ends with T, and has T in it?", answer: "A teapot" },
  { question: "What has a face and two hands but no arms or legs?", answer: "A clock" },
  { question: "What can you catch but not throw?", answer: "A cold" },
  { question: "What goes up but never comes down?", answer: "Your age" },
  { question: "What gets sharper the more you use it?", answer: "Your brain" },
  { question: "What can fill a room but takes no space?", answer: "Light" },
];

const ALL_SUBJECT_RIDDLES: RiddleEntry[] = [
  ...SCIENCE_RIDDLES,
  ...MATH_RIDDLES,
  ...ENGLISH_RIDDLES,
  ...HISTORY_RIDDLES,
  ...GEOGRAPHY_RIDDLES,
];

function filterRiddles(pool: RiddleEntry[], ctx: BrainFlexContext | undefined): RiddleEntry[] {
  const subject = getContextSubject(ctx);
  const topic = norm(ctx?.topic);
  const band = getContextGradeBand(ctx);
  const exclude = new Set((ctx?.excludeRiddles ?? []).map(normQuestion));

  return pool.filter((r) => {
    if (exclude.has(normQuestion(r.question))) return false;
    if (r.minBand && !bandAtLeast(band, r.minBand)) return false;
    if (r.subjects?.length && !r.subjects.includes(subject)) return false;
    if (r.topics?.length && topic) {
      if (!r.topics.some((t) => topic.includes(t) || matchesAny(topic, [t]))) return false;
    }
    return true;
  });
}

export async function pickRiddles(
  ctx: BrainFlexContext | undefined,
  count = 3,
): Promise<Array<{ question: string; answer: string }>> {
  const subject = getContextSubject(ctx);
  const topic = norm(ctx?.topic);
  const hasCurriculum = !isGenericBrainFlexSubject(ctx?.subject) || Boolean(topic);
  const exclude = new Set((ctx?.excludeRiddles ?? []).map(normQuestion));

  let picked: Array<{ question: string; answer: string }> = [];
  if (ctx?.knowledge && ctx.knowledge.vocabulary.length >= 2) {
    picked = buildRiddlesFromKnowledge(ctx.knowledge, count, exclude);
  }

  if (picked.length < count) {
    let pool: RiddleEntry[];
    if (!hasCurriculum) {
      pool = GENERAL_RIDDLES;
    } else if (subject !== "general") {
      const subjectPool = ALL_SUBJECT_RIDDLES.filter((r) => r.subjects?.includes(subject));
      const topicFiltered = topic
        ? subjectPool.filter(
            (r) =>
              !r.topics?.length ||
              r.topics.some((t) => topic.includes(t) || matchesAny(topic, [t])),
          )
        : subjectPool;
      pool = topicFiltered.length >= count ? topicFiltered : subjectPool;
    } else {
      pool = ALL_SUBJECT_RIDDLES.filter(
        (r) => r.topics?.some((t) => topic.includes(t) || matchesAny(topic, [t])),
      );
      if (pool.length < count) pool = ALL_SUBJECT_RIDDLES;
    }

    let filtered = filterRiddles(pool, ctx);
    const offset =
      filtered.length > count
        ? ((ctx?.generationAttempt ?? 0) + (ctx?.generationSeed ?? 0)) % filtered.length
        : 0;
    if (offset > 0) {
      filtered = [...filtered.slice(offset), ...filtered.slice(0, offset)];
    }

    const fromPool = seededShuffle(filtered, (ctx?.generationSeed ?? 0) + (ctx?.generationAttempt ?? 0) * 401).slice(
      0,
      count - picked.length,
    );
    picked = [...picked, ...fromPool];
  }

  if (picked.length < count && hasCurriculum) {
    const { expandRiddlesWithAi } = await import("./brainflexAiExpand");
    const extra = await expandRiddlesWithAi(ctx ?? {}, count - picked.length + 2);
    for (const r of extra) {
      if (picked.length >= count) break;
      const q = normQuestion(r.question);
      if (!q || exclude.has(q)) continue;
      if (picked.some((p) => normQuestion(p.question) === q)) continue;
      picked.push({ question: r.question, answer: r.answer });
    }
  }
  if (picked.length < count && !hasCurriculum) {
    picked = [
      ...picked,
      ...seededShuffle(filterRiddles(GENERAL_RIDDLES, ctx), (ctx?.generationSeed ?? 0) + 911).slice(
        0,
        count - picked.length,
      ),
    ];
  }

  return seededShuffle(picked, (ctx?.generationSeed ?? 0) + 1201)
    .slice(0, count)
    .map(({ question, answer }) => ({ question, answer }));
}

export type BrainTeaserEntry = { question: string; answer: string; subjects?: SubjectCategory[] };

function buildDynamicTeasers(ctx: BrainFlexContext | undefined): BrainTeaserEntry[] {
  const band = getContextGradeBand(ctx);
  const seed = (ctx?.generationSeed ?? Date.now()) + (ctx?.generationAttempt ?? 0) * 503;
  const maxN = band === "very_easy" ? 9 : band === "easy" ? 12 : band === "intermediate" ? 20 : 30;
  const a = 1 + (seed % maxN);
  const b = 1 + ((seed * 7) % maxN);
  const c = 1 + ((seed * 13) % Math.min(9, maxN));
  const d = 2 + ((seed * 19) % Math.min(8, maxN));
  const seqStart = 1 + ((seed * 23) % 5);
  const offset = seed % 4;

  const pool: BrainTeaserEntry[] = [
    { question: `What is ${a} + ${b} × ${c}?`, answer: String(a + b * c), subjects: ["math"] },
    { question: `What comes next: ${seqStart}, ${seqStart + 2}, ${seqStart + 4}, ${seqStart + 6}?`, answer: String(seqStart + 8) },
    { question: `What comes next: ${d}, ${d * 2}, ${d * 3}, ${d * 4}?`, answer: String(d * 5) },
    { question: `A farmer has ${17 + offset} sheep; all but ${9 + offset} run away. How many left?`, answer: String(9 + offset) },
    { question: `If ${2 + offset} cats catch ${2 + offset} mice in ${3 + offset} minutes, how many cats for 100 mice?`, answer: `${2 + offset} cats` },
    { question: `What is half of ${a * 2}?`, answer: String(a) },
    { question: `What is ${a + b} − ${b}?`, answer: String(a), subjects: ["math"] },
    { question: `Double ${c} and add ${a}. What is the result?`, answer: String(c * 2 + a), subjects: ["math"] },
  ];
  return seededShuffle(pool, seed + 89).slice(0, 6);
}

const CURRICULUM_TEASERS: BrainTeaserEntry[] = [
  { question: "If you eat 1/4 of a pizza, what fraction is left?", answer: "3/4", subjects: ["math"] },
  { question: "Convert 50% to a fraction in simplest form.", answer: "1/2", subjects: ["math"] },
  { question: "What is 0.5 as a fraction?", answer: "1/2", subjects: ["math"] },
  { question: "Gas released by plants during photosynthesis.", answer: "Oxygen", subjects: ["science"] },
  { question: "Gas taken in by plants for photosynthesis.", answer: "Carbon dioxide", subjects: ["science"] },
  { question: "Green pigment found in leaves.", answer: "Chlorophyll", subjects: ["science"] },
  { question: "Find the verb: 'The dog runs fast.'", answer: "runs", subjects: ["english"] },
  { question: "Find the noun: 'Ravi reads books.'", answer: "Ravi or books", subjects: ["english"] },
  { question: "Past tense of 'go'.", answer: "went", subjects: ["english"] },
  { question: "Which layer of Earth do we live on?", answer: "Crust", subjects: ["geography"] },
  { question: "Capital of India.", answer: "New Delhi", subjects: ["history", "geography"] },
  { question: "Year of Indian Independence.", answer: "1947", subjects: ["history"] },
];

export async function pickBrainTeasers(
  ctx: BrainFlexContext | undefined,
  count = 3,
): Promise<Array<{ question: string; answer: string }>> {
  const subject = getContextSubject(ctx);
  const hasCurriculum = !isGenericBrainFlexSubject(ctx?.subject);
  const exclude = new Set((ctx?.excludeBrainTeasers ?? []).map(normQuestion));

  let picked: Array<{ question: string; answer: string }> = [];
  if (ctx?.knowledge && ctx.knowledge.vocabulary.length >= 2) {
    picked = buildTeasersFromKnowledge(ctx.knowledge, count, exclude);
  }

  if (picked.length < count) {
    let pool: BrainTeaserEntry[];
    if (!hasCurriculum || subject === "general") {
      pool = [...buildDynamicTeasers(ctx), ...CURRICULUM_TEASERS];
    } else if (subject === "math") {
      pool = [
        ...buildDynamicTeasers(ctx),
        ...CURRICULUM_TEASERS.filter((t) => t.subjects?.includes("math")),
      ];
    } else {
      pool = [
        ...buildDynamicTeasers(ctx),
        ...CURRICULUM_TEASERS.filter((t) => t.subjects?.includes(subject)),
      ];
    }

    pool = pool.filter((t) => !exclude.has(normQuestion(t.question)));
    const offset =
      pool.length > count ? ((ctx?.generationAttempt ?? 0) + (ctx?.generationSeed ?? 0)) % pool.length : 0;
    if (offset > 0) {
      pool = [...pool.slice(offset), ...pool.slice(0, offset)];
    }
    const fromPool = seededShuffle(pool, (ctx?.generationSeed ?? 0) + (ctx?.generationAttempt ?? 0) * 307).slice(
      0,
      count - picked.length,
    );
    picked = [...picked, ...fromPool];
  }

  if (picked.length < count && hasCurriculum) {
    const { expandBrainTeasersWithAi } = await import("./brainflexAiExpand");
    const extra = await expandBrainTeasersWithAi(ctx ?? {}, count - picked.length + 2);
    for (const t of extra) {
      if (picked.length >= count) break;
      const q = normQuestion(t.question);
      if (!q || exclude.has(q)) continue;
      if (picked.some((p) => normQuestion(p.question) === q)) continue;
      picked.push(t);
    }
  }

  return seededShuffle(picked, (ctx?.generationSeed ?? 0) + 1303)
    .slice(0, count)
    .map(({ question, answer }) => ({ question, answer }));
}
