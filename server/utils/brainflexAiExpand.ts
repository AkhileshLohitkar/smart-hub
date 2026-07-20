/**
 * AI vocabulary expansion for Brain-Flex when local topic pools are insufficient.
 * Generation-only — never adds cross-subject words.
 */

import {
  type SubjectCategory,
  resolveSubjectCategory,
  registerCurriculumClues,
  gradeToBand,
  parseGrade,
} from "./brainflexCurriculum";
import type { BrainFlexContext } from "./brainflexContext";
import { registerBrainflexRuntimeClue } from "./wordMeanings";
import { isNotesPlaceholderClue } from "./brainflexKnowledge";

const AI_PARAMS = {
  temperature: 0.95,
  top_p: 0.95,
  frequency_penalty: 0.9,
  presence_penalty: 0.85,
} as const;

const ORIGINALITY_RULES = `
Generate a completely original worksheet.
Do not reuse previous wording.
Avoid repetitive educational concepts whenever possible.
Create fresh clues with varied sentence structure.
Use varied educational vocabulary and synonyms.
Vary question style, difficulty, and ordering.
Produce a unique learning experience every time.
Never write placeholder clues like "a term from the student's notes".
Write teacher-quality definitions that teach and explain.
`;

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

async function buildEducationalPromptBlock(ctx: BrainFlexContext): Promise<string> {
  const { formatKnowledgePromptBlock } = await import("./brainflexKnowledge");
  const { formatNotesPromptBlock } = await import("./brainflexMyNotes");
  return formatKnowledgePromptBlock(ctx.knowledge) || formatNotesPromptBlock(ctx.notesContext);
}

export async function expandTopicVocabularyWithAi(
  ctx: BrainFlexContext,
  count: number,
): Promise<string[]> {
  if (count <= 0) return [];

  const client = await getOpenAiClient();
  if (!client) return [];

  const subject = resolveSubjectCategory(ctx.subject);
  if (subject === "general" && !ctx.topic?.trim()) return [];

  const band = gradeToBand(parseGrade(ctx.grade));
  const exclude = new Set((ctx.excludeWords ?? []).map((w) => w.toUpperCase()));
  const excludeList = (ctx.excludeWords ?? []).slice(0, 60).join(", ");
  const knowledgeBlock = await buildEducationalPromptBlock(ctx);
  const difficultyHint = ctx.difficultyHint ?? "medium";
  const variationNonce = (ctx.generationSeed ?? 0) + (ctx.generationAttempt ?? 0) * 17;

  const prompt = `Generate exactly ${count} uppercase English vocabulary words for a school worksheet.

Board: ${ctx.board || "General"}
Grade: ${ctx.grade || "Unknown"} (${band} difficulty, leaning ${difficultyHint} within grade)
Subject: ${ctx.subject || "General"}
Topic: ${ctx.topic || "General topic within subject"}
Variation nonce: ${variationNonce}
${knowledgeBlock}
${ORIGINALITY_RULES}
Rules:
- Words must be ONLY about the given subject and topic
- Prefer accurate terminology found in the student's My Notes when provided
- Never include words from other subjects (no math words in English, no grammar in Science, etc.)
- Each word: 4–10 letters, A–Z only, no spaces or hyphens
- Grade-appropriate vocabulary and terminology
- Board-appropriate wording when board is CBSE or Maharashtra State Board
- Each clue must be a short educational definition that helps identify the word without naming it
- Never use placeholder clues like "Find this hidden word in the grid"
- Do NOT repeat or closely paraphrase: ${excludeList || "none"}

Return JSON: { "words": [ { "word": "EXAMPLE", "clue": "Short child-friendly definition/clue sentence." } ] }`;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      ...AI_PARAMS,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate curriculum-aligned vocabulary for Indian school worksheets. Write teacher-quality definitions. Output valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      words?: Array<{ word?: string; clue?: string }>;
    };

    const out: string[] = [];
    const clues: Record<string, string> = {};
    for (const entry of parsed.words ?? []) {
      const w = String(entry.word || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
      const clue = String(entry.clue || "").trim();
      if (exclude.has(w)) continue;
      if (w.length >= 4 && w.length <= 12 && /^[A-Z]+$/.test(w)) {
        out.push(w);
        if (clue && !isNotesPlaceholderClue(clue)) {
          clues[w] = clue;
          registerBrainflexRuntimeClue(w, clue);
        }
      }
    }

    if (Object.keys(clues).length > 0) registerCurriculumClues(clues);
    return out.slice(0, count);
  } catch (err) {
    console.warn("[BrainFlex] AI vocabulary expansion failed:", err);
    return [];
  }
}

export async function expandRiddlesWithAi(
  ctx: BrainFlexContext,
  count: number,
): Promise<Array<{ question: string; answer: string }>> {
  if (count <= 0) return [];

  const client = await getOpenAiClient();
  if (!client) return [];

  const subject = resolveSubjectCategory(ctx.subject);
  if (subject === "general" && !ctx.topic?.trim()) return [];

  const exclude = new Set((ctx.excludeRiddles ?? []).map((q) => q.toLowerCase().trim()));
  const excludeList = (ctx.excludeRiddles ?? []).slice(0, 20).join(" | ");
  const knowledgeBlock = await buildEducationalPromptBlock(ctx);
  const difficultyHint = ctx.difficultyHint ?? "medium";
  const variationNonce = (ctx.generationSeed ?? 0) + (ctx.generationAttempt ?? 0) * 19;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      ...AI_PARAMS,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Create ${count} short riddles for Grade ${ctx.grade || "6"} ${ctx.subject || "General"} students.
Topic: ${ctx.topic || "within subject"}
Board: ${ctx.board || "CBSE"}
Difficulty lean: ${difficultyHint}
Variation nonce: ${variationNonce}
Do not repeat or closely paraphrase: ${excludeList || "none"}
${knowledgeBlock}
${ORIGINALITY_RULES}
Prefer terminology and facts from the unified knowledge object when provided.
Return JSON: { "riddles": [ { "question": "...", "answer": "..." } ] }`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as {
      riddles?: Array<{ question?: string; answer?: string }>;
    };
    return (parsed.riddles ?? [])
      .map((r) => ({
        question: String(r.question || "").trim(),
        answer: String(r.answer || "").trim(),
      }))
      .filter((r) => {
        if (!r.question || !r.answer) return false;
        const q = r.question.toLowerCase().trim();
        return !exclude.has(q);
      })
      .slice(0, count);
  } catch {
    return [];
  }
}

export async function expandBrainTeasersWithAi(
  ctx: BrainFlexContext,
  count: number,
): Promise<Array<{ question: string; answer: string }>> {
  if (count <= 0) return [];

  const client = await getOpenAiClient();
  if (!client) return [];

  const exclude = new Set((ctx.excludeBrainTeasers ?? []).map((q) => q.toLowerCase().trim()));
  const excludeList = (ctx.excludeBrainTeasers ?? []).slice(0, 20).join(" | ");
  const band = gradeToBand(parseGrade(ctx.grade));
  const knowledgeBlock = await buildEducationalPromptBlock(ctx);
  const difficultyHint = ctx.difficultyHint ?? "medium";
  const variationNonce = (ctx.generationSeed ?? 0) + (ctx.generationAttempt ?? 0) * 23;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      ...AI_PARAMS,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Create ${count} brain teasers for Grade ${ctx.grade || "6"} (${band}, leaning ${difficultyHint}).
Subject: ${ctx.subject || "General"}, Topic: ${ctx.topic || "curriculum"}
Variation nonce: ${variationNonce}
Use ${resolveSubjectCategory(ctx.subject) === "math" ? "number/logic" : "subject-relevant"} reasoning.
Do not repeat or closely paraphrase: ${excludeList || "none"}
${knowledgeBlock}
${ORIGINALITY_RULES}
Generate topic-aware reasoning questions from the knowledge object — not generic internet trivia.
Prefer educational accuracy from the student's notes when provided.
Return JSON: { "teasers": [ { "question": "...", "answer": "..." } ] }`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as {
      teasers?: Array<{ question?: string; answer?: string }>;
    };
    return (parsed.teasers ?? [])
      .map((t) => ({
        question: String(t.question || "").trim(),
        answer: String(t.answer || "").trim(),
      }))
      .filter((t) => {
        if (!t.question || !t.answer) return false;
        const q = t.question.toLowerCase().trim();
        return !exclude.has(q);
      })
      .slice(0, count);
  } catch {
    return [];
  }
}
