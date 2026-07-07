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

const AI_PARAMS = {
  temperature: 0.9,
  top_p: 0.95,
  frequency_penalty: 0.8,
  presence_penalty: 0.7,
} as const;

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
  const exclude = (ctx.excludeWords ?? []).slice(0, 40).join(", ");

  const prompt = `Generate exactly ${count} uppercase English vocabulary words for a school worksheet.

Board: ${ctx.board || "General"}
Grade: ${ctx.grade || "Unknown"} (${band} difficulty)
Subject: ${ctx.subject || "General"}
Topic: ${ctx.topic || "General topic within subject"}

Rules:
- Words must be ONLY about the given subject and topic
- Never include words from other subjects (no math words in English, no grammar in Science, etc.)
- Each word: 4–10 letters, A–Z only, no spaces or hyphens
- Grade-appropriate vocabulary and terminology
- Board-appropriate wording when board is CBSE or Maharashtra State Board
- Do NOT repeat: ${exclude || "none"}

Return JSON: { "words": [ { "word": "EXAMPLE", "clue": "Short child-friendly clue sentence." } ] }`;

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
            "You generate curriculum-aligned vocabulary for Indian school worksheets. Output valid JSON only.",
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
      if (w.length >= 4 && w.length <= 12 && /^[A-Z]+$/.test(w)) {
        out.push(w);
        if (clue) clues[w] = clue;
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

  const exclude = (ctx.excludeRiddles ?? []).slice(0, 15).join(" | ");

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
Do not repeat: ${exclude || "none"}
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
      .filter((r) => r.question && r.answer)
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

  const exclude = (ctx.excludeBrainTeasers ?? []).slice(0, 15).join(" | ");
  const band = gradeToBand(parseGrade(ctx.grade));

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      ...AI_PARAMS,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Create ${count} brain teasers for Grade ${ctx.grade || "6"} (${band}).
Subject: ${ctx.subject || "General"}, Topic: ${ctx.topic || "curriculum"}
Use ${resolveSubjectCategory(ctx.subject) === "math" ? "number/logic" : "subject-relevant"} reasoning.
Do not repeat: ${exclude || "none"}
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
      .filter((t) => t.question && t.answer)
      .slice(0, count);
  } catch {
    return [];
  }
}
