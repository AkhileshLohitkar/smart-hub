/**
 * Brain-Flex Knowledge Extraction Layer.
 * Builds one unified Knowledge Object from My Notes (priority 1), then curriculum fallbacks.
 * Generation-only — does not touch My Notes upload, storage, or UI.
 */

import type { BrainFlexContext } from "./brainflexContext";
import { isGenericBrainFlexSubject } from "./brainflexContext";
import {
  resolveCurriculumWordPool,
  getCurriculumClue,
  gradeToBand,
  parseGrade,
} from "./brainflexCurriculum";
import { lookupTopicClue } from "./brainflexTopicClues";
import { getWordSearchClue, isPlaceholderWordSearchClue } from "@shared/wordSearchClues";
import { registerBrainflexRuntimeClue } from "./wordMeanings";
import { isGenericClueText } from "./brainflexTopicClues";
import type { BrainFlexNotesEnrichment } from "./brainflexMyNotes";

export type BrainFlexVocabEntry = {
  word: string;
  definition: string;
};

export type BrainFlexKnowledgeSource = "notes" | "curriculum" | "board" | "general";

/** Unified knowledge base for one BrainFlex worksheet generation. */
export type BrainFlexKnowledgeObject = {
  mainTopic: string;
  subTopics: string[];
  vocabulary: BrainFlexVocabEntry[];
  definitions: Record<string, string>;
  facts: string[];
  examples: string[];
  keywords: string[];
  learningObjectives: string[];
  relationships: string[];
  source: BrainFlexKnowledgeSource;
  rawExcerpt?: string;
};

/** Generic school/meta words — excluded when notes-backed knowledge is active. */
export const GENERIC_SCHOOL_WORDS = new Set([
  "GRADE", "COLOUR", "COLOR", "YEAR", "CLASS", "SCHOOL", "TEACHER", "STUDENT",
  "LESSON", "SUBJECT", "TOPIC", "CHAPTER", "BOARD", "EXAM", "TEST", "QUIZ",
  "PUZZLE", "BRAIN", "FOCUS", "SMART", "THINK", "MEMORY", "PATTERN", "LOGIC",
  "MIND", "SKILL", "STUDY", "SOLVE", "BRIGHT", "TRAIN", "BOOK", "READ", "WRITE",
  "WORD", "GAME", "ENGLISH", "HINDI", "NUMBER", "SHAPES",
]);

const NOTES_PLACEHOLDER_RE =
  /^a term from the student'?s notes/i;

export function isNotesPlaceholderClue(clue: string): boolean {
  return NOTES_PLACEHOLDER_RE.test(String(clue || "").trim());
}

function normWord(w: string): string {
  return String(w || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function isGoodClue(clue: string): boolean {
  const c = String(clue || "").trim();
  if (!c || c.length < 12) return false;
  if (isPlaceholderWordSearchClue(c)) return false;
  if (isGenericClueText(c)) return false;
  if (isNotesPlaceholderClue(c)) return false;
  return true;
}

function toClueFromSentence(sentence: string, word: string): string {
  let s = sentence.trim().replace(/\s+/g, " ");
  if (s.length > 160) s = `${s.slice(0, 157)}…`;
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
}

/** Programmatic extraction from note text — no API required. */
export function extractKnowledgeProgrammatically(
  notesText: string,
  ctx: BrainFlexContext,
): BrainFlexKnowledgeObject {
  const text = String(notesText || "").trim();
  const mainTopic = String(ctx.topic || ctx.subject || "this topic").trim();
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const tokens = text.match(/[A-Za-z][A-Za-z'-]{2,}/g) ?? [];
  const vocabSet = new Set<string>();
  for (const raw of tokens) {
    const u = normWord(raw);
    if (u.length >= 4 && u.length <= 12 && !GENERIC_SCHOOL_WORDS.has(u)) {
      vocabSet.add(u);
    }
  }

  const definitions: Record<string, string> = {};
  const facts: string[] = [];
  const examples: string[] = [];
  const keywords: string[] = [];
  const relationships: string[] = [];
  const learningObjectives: string[] = [];

  for (const sent of sentences) {
    const lower = sent.toLowerCase();

    if (/^(for example|e\.g\.|such as|like)\b/i.test(sent)) {
      examples.push(sent);
    }
    if (/\b(helps|important|because|contains|rich in|source of|needed for|gives|provides)\b/i.test(sent)) {
      facts.push(sent);
    }
    if (/\b(students will|learning objective|students learn|you will learn|aim:)\b/i.test(lower)) {
      learningObjectives.push(sent);
    }
    if (/\b(related to|connected to|linked to|part of|type of|kind of)\b/i.test(lower)) {
      relationships.push(sent);
    }

    // Definition patterns: "Cheese is a dairy product...", "Calcium: helps bones", "Protein means ..."
    const defPatterns = [
      /^([A-Za-z][A-Za-z\s'-]{2,24}?)\s+is\s+(?:a|an|the)\s+(.+)$/i,
      /^([A-Za-z][A-Za-z\s'-]{2,24}?)\s+means\s+(.+)$/i,
      /^([A-Za-z][A-Za-z\s'-]{2,24}?)\s*:\s*(.+)$/,
      /^([A-Za-z][A-Za-z\s'-]{2,24}?)\s*[-–—]\s*(.+)$/,
    ];
    for (const pat of defPatterns) {
      const m = sent.match(pat);
      if (!m) continue;
      const word = normWord(m[1]!);
      const def = m[2]!.trim();
      if (word.length >= 4 && def.length >= 10 && !GENERIC_SCHOOL_WORDS.has(word)) {
        definitions[word] = toClueFromSentence(def.charAt(0).toUpperCase() + def.slice(1), word);
        vocabSet.add(word);
      }
    }
  }

  // Match vocabulary to best supporting sentence
  for (const word of vocabSet) {
    if (definitions[word] && isGoodClue(definitions[word]!)) continue;
    for (const sent of sentences) {
      const re = new RegExp(`\\b${word}\\b`, "i");
      if (!re.test(sent)) continue;
      if (sent.length < word.length + 15) continue;
      const clue = toClueFromSentence(sent, word);
      if (isGoodClue(clue)) {
        definitions[word] = clue;
        break;
      }
    }
  }

  const vocabulary: BrainFlexVocabEntry[] = [];
  for (const word of vocabSet) {
    const def = definitions[word];
    if (def && isGoodClue(def)) {
      vocabulary.push({ word, definition: def });
      keywords.push(word.toLowerCase());
    }
  }

  const subTopics = [...new Set(
    sentences
      .filter((s) => /^[A-Z][^.!?]{3,40}:?\s*$/.test(s.trim()) || /^\d+\.\s+[A-Z]/.test(s.trim()))
      .map((s) => s.replace(/^\d+\.\s*/, "").trim())
      .slice(0, 8),
  )];

  return {
    mainTopic,
    subTopics,
    vocabulary: vocabulary.slice(0, 48),
    definitions,
    facts: [...new Set(facts)].slice(0, 12),
    examples: [...new Set(examples)].slice(0, 8),
    keywords: [...new Set(keywords)].slice(0, 32),
    learningObjectives: [...new Set(learningObjectives)].slice(0, 6),
    relationships: [...new Set(relationships)].slice(0, 8),
    source: "notes",
    rawExcerpt: text.slice(0, 2000),
  };
}

async function getOpenAiClient(): Promise<import("openai").OpenAI | null> {
  try {
    const mod = await import("../openaiClient");
    const key =
      process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      "";
    if (!key || key === mod.DEV_OPENAI_PLACEHOLDER) return null;
    return mod.openai;
  } catch {
    return null;
  }
}

/** AI-enhanced knowledge extraction from merged notes. */
export async function extractKnowledgeWithAi(
  notesText: string,
  ctx: BrainFlexContext,
): Promise<Partial<BrainFlexKnowledgeObject>> {
  const client = await getOpenAiClient();
  if (!client || !notesText.trim()) return {};

  const band = gradeToBand(parseGrade(ctx.grade));
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract structured educational knowledge from student notes for Indian school worksheets. Output valid JSON only. Write teacher-quality definitions — never placeholder text.",
        },
        {
          role: "user",
          content: `Extract a unified knowledge object from these student notes.

Board: ${ctx.board || "General"}
Grade: ${ctx.grade || "Unknown"} (${band})
Subject: ${ctx.subject || "General"}
Topic / Curriculum Focus: ${ctx.topic || mainTopicFrom(ctx)}

NOTES:
-----
${notesText.slice(0, 3200)}
-----

Return JSON:
{
  "mainTopic": "string",
  "subTopics": ["string"],
  "vocabulary": [ { "word": "CHEESE", "definition": "A dairy product made from milk that is rich in calcium." } ],
  "facts": ["important fact sentences from the notes"],
  "examples": ["concrete examples from the notes"],
  "keywords": ["keyword"],
  "learningObjectives": ["what students should learn"],
  "relationships": ["how concepts connect"]
}

Rules:
- vocabulary words: 4–12 letters, A–Z only, topic-relevant ONLY
- each definition must teach/explain like a teacher (never "a term from notes")
- do NOT include generic school words (GRADE, CLASS, COLOUR, YEAR) unless central to the notes
- stay faithful to the notes; do not invent unrelated facts`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
    return normalizeAiKnowledge(parsed);
  } catch (err) {
    console.warn("[BrainFlex Knowledge] AI extraction failed:", err);
    return {};
  }
}

function mainTopicFrom(ctx: BrainFlexContext): string {
  return String(ctx.topic || ctx.subject || "General").trim();
}

function normalizeAiKnowledge(raw: Record<string, unknown>): Partial<BrainFlexKnowledgeObject> {
  const vocabulary: BrainFlexVocabEntry[] = [];
  const definitions: Record<string, string> = {};

  for (const entry of (raw.vocabulary as Array<{ word?: string; definition?: string }>) ?? []) {
    const word = normWord(entry.word ?? "");
    const definition = String(entry.definition ?? "").trim();
    if (!word || word.length < 4 || !isGoodClue(definition)) continue;
    if (GENERIC_SCHOOL_WORDS.has(word)) continue;
    vocabulary.push({ word, definition });
    definitions[word] = definition;
  }

  const pickStrings = (key: string) =>
    ((raw[key] as string[]) ?? [])
      .map((s) => String(s).trim())
      .filter((s) => s.length > 8)
      .slice(0, 12);

  return {
    mainTopic: String(raw.mainTopic ?? "").trim() || undefined,
    subTopics: pickStrings("subTopics"),
    vocabulary,
    definitions,
    facts: pickStrings("facts"),
    examples: pickStrings("examples"),
    keywords: pickStrings("keywords"),
    learningObjectives: pickStrings("learningObjectives"),
    relationships: pickStrings("relationships"),
  };
}

export function mergeKnowledgeObjects(
  base: BrainFlexKnowledgeObject,
  extra: Partial<BrainFlexKnowledgeObject>,
): BrainFlexKnowledgeObject {
  const defs = { ...base.definitions, ...(extra.definitions ?? {}) };
  const vocabMap = new Map<string, BrainFlexVocabEntry>();
  for (const v of [...base.vocabulary, ...(extra.vocabulary ?? [])]) {
    if (isGoodClue(v.definition)) vocabMap.set(v.word, v);
  }
  for (const [word, def] of Object.entries(extra.definitions ?? {})) {
    if (isGoodClue(def)) vocabMap.set(word, { word, definition: def });
  }

  return {
    mainTopic: extra.mainTopic || base.mainTopic,
    subTopics: [...new Set([...base.subTopics, ...(extra.subTopics ?? [])])].slice(0, 10),
    vocabulary: [...vocabMap.values()].slice(0, 56),
    definitions: defs,
    facts: [...new Set([...base.facts, ...(extra.facts ?? [])])].slice(0, 14),
    examples: [...new Set([...base.examples, ...(extra.examples ?? [])])].slice(0, 10),
    keywords: [...new Set([...base.keywords, ...(extra.keywords ?? [])])].slice(0, 36),
    learningObjectives: [...new Set([...base.learningObjectives, ...(extra.learningObjectives ?? [])])].slice(0, 8),
    relationships: [...new Set([...base.relationships, ...(extra.relationships ?? [])])].slice(0, 10),
    source: base.source,
    rawExcerpt: base.rawExcerpt || extra.rawExcerpt,
  };
}

function buildKnowledgeFromCurriculum(ctx: BrainFlexContext, source: BrainFlexKnowledgeSource): BrainFlexKnowledgeObject {
  const mainTopic = mainTopicFrom(ctx);
  const words = resolveCurriculumWordPool({
    board: ctx.board,
    grade: ctx.grade,
    subject: ctx.subject,
    topic: ctx.topic,
  });

  const vocabulary: BrainFlexVocabEntry[] = [];
  const definitions: Record<string, string> = {};

  for (const raw of words) {
    const word = normWord(raw);
    if (!word || GENERIC_SCHOOL_WORDS.has(word)) continue;
    const def =
      lookupTopicClue(word) ||
      getCurriculumClue(word) ||
      getWordSearchClue(word);
    if (!isGoodClue(def)) continue;
    vocabulary.push({ word, definition: def });
    definitions[word] = def;
  }

  return {
    mainTopic,
    subTopics: ctx.topic ? [ctx.topic] : [],
    vocabulary: vocabulary.slice(0, 48),
    definitions,
    facts: [],
    examples: [],
    keywords: vocabulary.map((v) => v.word.toLowerCase()).slice(0, 24),
    learningObjectives: [`Understand key concepts about ${mainTopic}.`],
    relationships: [],
    source,
  };
}

function buildGeneralKnowledge(ctx: BrainFlexContext): BrainFlexKnowledgeObject {
  return buildKnowledgeFromCurriculum(ctx, "general");
}

/**
 * Priority: Notes → Curriculum Focus → Board+Grade → General.
 * Registers real clues for every vocabulary entry.
 */
export async function resolveBrainFlexKnowledge(
  ctx: BrainFlexContext,
  notes: BrainFlexNotesEnrichment,
): Promise<BrainFlexKnowledgeObject> {
  let knowledge: BrainFlexKnowledgeObject | null = null;

  if (notes.notesContext?.trim()) {
    const programmatic = extractKnowledgeProgrammatically(notes.notesContext, ctx);
    const aiPart = await extractKnowledgeWithAi(notes.notesContext, ctx);
    knowledge = mergeKnowledgeObjects(programmatic, aiPart);
    knowledge.rawExcerpt = notes.notesContext;
    knowledge.source = "notes";

    if (knowledge.vocabulary.length >= 4) {
      registerKnowledgeClues(knowledge);
      return knowledge;
    }
  }

  const hasCurriculum =
    !isGenericBrainFlexSubject(ctx.subject) || Boolean(ctx.topic?.trim());

  if (hasCurriculum && ctx.topic?.trim()) {
    knowledge = buildKnowledgeFromCurriculum(ctx, "curriculum");
    if (knowledge.vocabulary.length >= 4) {
      registerKnowledgeClues(knowledge);
      return knowledge;
    }
  }

  if (hasCurriculum) {
    knowledge = buildKnowledgeFromCurriculum(ctx, "board");
    if (knowledge.vocabulary.length >= 4) {
      registerKnowledgeClues(knowledge);
      return knowledge;
    }
  }

  knowledge = buildGeneralKnowledge(ctx);
  registerKnowledgeClues(knowledge);
  return knowledge;
}

export function registerKnowledgeClues(knowledge: BrainFlexKnowledgeObject): void {
  for (const entry of knowledge.vocabulary) {
    if (isGoodClue(entry.definition)) {
      registerBrainflexRuntimeClue(entry.word, entry.definition);
    }
  }
  for (const [word, def] of Object.entries(knowledge.definitions)) {
    if (isGoodClue(def)) registerBrainflexRuntimeClue(word, def);
  }
}

export function getKnowledgeClue(knowledge: BrainFlexKnowledgeObject | undefined, word: string): string | null {
  if (!knowledge) return null;
  const u = normWord(word);
  const def = knowledge.definitions[u] || knowledge.vocabulary.find((v) => v.word === u)?.definition;
  return def && isGoodClue(def) ? def : null;
}

export function isWordInKnowledge(knowledge: BrainFlexKnowledgeObject | undefined, word: string): boolean {
  if (!knowledge) return false;
  const u = normWord(word);
  return Boolean(knowledge.definitions[u] || knowledge.vocabulary.some((v) => v.word === u));
}

export function knowledgeWordPool(knowledge: BrainFlexKnowledgeObject | undefined): string[] {
  if (!knowledge) return [];
  return knowledge.vocabulary.map((v) => v.word);
}

export function shouldRejectGenericWord(
  word: string,
  knowledge: BrainFlexKnowledgeObject | undefined,
): boolean {
  const u = normWord(word);
  if (!knowledge || knowledge.source !== "notes") return false;
  if (!GENERIC_SCHOOL_WORDS.has(u)) return false;
  return !isWordInKnowledge(knowledge, u);
}

/** Structured block for AI activity generation prompts. */
export function formatKnowledgePromptBlock(knowledge: BrainFlexKnowledgeObject | undefined): string {
  if (!knowledge || knowledge.vocabulary.length === 0) return "";

  const vocabLines = knowledge.vocabulary
    .slice(0, 24)
    .map((v) => `- ${v.word}: ${v.definition}`)
    .join("\n");

  const facts = knowledge.facts.slice(0, 6).map((f) => `- ${f}`).join("\n");
  const objectives = knowledge.learningObjectives.slice(0, 4).map((o) => `- ${o}`).join("\n");

  return `

UNIFIED KNOWLEDGE OBJECT (use as the ONLY source of truth for this worksheet):
Main topic: ${knowledge.mainTopic}
Source: ${knowledge.source}
${knowledge.subTopics.length ? `Sub-topics: ${knowledge.subTopics.join(", ")}` : ""}

Learning objectives:
${objectives || `- Understand ${knowledge.mainTopic}`}

Vocabulary with teacher-written definitions:
${vocabLines}

${facts ? `Important facts from notes:\n${facts}` : ""}

Rules:
- Every word, clue, riddle, and brain teaser MUST stay on this topic
- Use the definitions above for clues — never write placeholder clues
- Do NOT introduce unrelated school/meta words (GRADE, CLASS, COLOUR, YEAR) unless listed above
- Write like an experienced teacher for Grade ${knowledge.mainTopic ? "level" : "students"}
`;
}

/** Topic-aware brain teasers from knowledge facts (no generic internet questions). */
export function buildTeasersFromKnowledge(
  knowledge: BrainFlexKnowledgeObject,
  count: number,
  exclude: Set<string>,
): Array<{ question: string; answer: string }> {
  const out: Array<{ question: string; answer: string }> = [];
  const topic = knowledge.mainTopic;

  for (const entry of knowledge.vocabulary) {
    if (out.length >= count) break;
    const q = `Which word matches this description: ${entry.definition}`;
    const key = q.toLowerCase().trim();
    if (exclude.has(key)) continue;
    out.push({ question: q, answer: entry.word });
  }

  for (const fact of knowledge.facts) {
    if (out.length >= count) break;
    const q = `Based on ${topic}, answer briefly: ${fact.replace(/\.$/, "")}?`;
    const key = q.toLowerCase().trim();
    if (exclude.has(key) || q.length > 180) continue;
    const answerWord = knowledge.vocabulary.find((v) =>
      fact.toLowerCase().includes(v.word.toLowerCase()),
    );
    out.push({
      question: q,
      answer: answerWord?.word ?? "See notes",
    });
  }

  for (const rel of knowledge.relationships) {
    if (out.length >= count) break;
    const q = `Explain the connection: ${rel}`;
    const key = q.toLowerCase().trim();
    if (exclude.has(key)) continue;
    out.push({ question: q, answer: rel.split(/\b(is|are|helps|means)\b/i)[0]?.trim() || topic });
  }

  return out.slice(0, count);
}

/** Topic-aware riddle seeds from knowledge vocabulary. */
export function buildRiddlesFromKnowledge(
  knowledge: BrainFlexKnowledgeObject,
  count: number,
  exclude: Set<string>,
): Array<{ question: string; answer: string }> {
  const out: Array<{ question: string; answer: string }> = [];

  for (const entry of knowledge.vocabulary) {
    if (out.length >= count) break;
    const q = `I am described as follows: ${entry.definition} What am I?`;
    const key = q.toLowerCase().trim();
    if (exclude.has(key)) continue;
    out.push({ question: q, answer: entry.word.charAt(0) + entry.word.slice(1).toLowerCase() });
  }

  for (const example of knowledge.examples) {
    if (out.length >= count) break;
    const matched = knowledge.vocabulary.find((v) =>
      example.toLowerCase().includes(v.word.toLowerCase()),
    );
    if (!matched) continue;
    const q = `This example from ${knowledge.mainTopic} relates to me: ${example} What word am I?`;
    const key = q.toLowerCase().trim();
    if (exclude.has(key)) continue;
    out.push({
      question: q,
      answer: matched.word.charAt(0) + matched.word.slice(1).toLowerCase(),
    });
  }

  return out.slice(0, count);
}
