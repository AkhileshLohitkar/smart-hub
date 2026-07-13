import type { Express, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerPaymentRoutes } from "./payments/routes";
import { registerQuestionPaperRoutes } from "./questionPaperRoutes";
import { openai } from "./openaiClient";
import { buildPricingApiPayload } from "@shared/pricing";
import {
  pricingPlans,
  resolvePaidPlanKeyFromPlanName,
  inferBillingCycleFromPlanName,
  type BillingCycle,
  type PlanType,
} from "./config/pricing";
import { ensureWorksheetQuota, recordWorksheetGeneration } from "./services/worksheetQuota";
import { generateWorksheet } from "./services/openaiService";
import { logUserActivity } from "./services/userActivity";
import { db } from "./db";
import { brainflexWorksheets, userActivityLogs, normalizeWatermark } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { brainFlexContentFromSelection, extractBrainFlexUsedWords, extractBrainFlexUsedRiddles, extractBrainFlexUsedBrainTeasers } from "./BrainFlexPuzzle";
import type { BrainFlexContext } from "./utils/brainflexContext";
import {
  BRAIN_FLEX_RESTRICTED_SUBJECT_MESSAGE,
  isBrainFlexRestrictedSubject,
} from "@shared/brainFlexRestrictedSubjects";
import { hasAnswerKeyInContent, countAnswerKeyEntries } from "@shared/answerKey";
import { getAnswerKeyPath } from "@shared/answerKeyUrl";
import { logAnswerKeySaved } from "./utils/answerKeyLog";

const BRAIN_FLEX_HISTORY_WORKSHEETS = 20;

// Best-effort de-duplication across recent generations per user (memory only).
const recentBrainFlexHashesByUser = new Map<number, string[]>();
const recentBrainFlexWordsByUser = new Map<number, string[]>();
const recentBrainFlexRiddlesByUser = new Map<number, string[]>();
const recentBrainFlexTeasersByUser = new Map<number, string[]>();

function makeBrainFlexContext(
  body: { board?: string; className?: string; subject?: string; chapter?: string },
  userId?: number,
): BrainFlexContext {
  return {
    board: body.board,
    grade: body.className,
    subject: body.subject,
    topic: body.chapter,
    excludeWords: userId != null ? (recentBrainFlexWordsByUser.get(userId) ?? []) : [],
    excludeRiddles: userId != null ? (recentBrainFlexRiddlesByUser.get(userId) ?? []) : [],
    excludeBrainTeasers: userId != null ? (recentBrainFlexTeasersByUser.get(userId) ?? []) : [],
  };
}

function recordBrainFlexGeneration(
  userId: number,
  content: Awaited<ReturnType<typeof brainFlexContentFromSelection>>,
) {
  const hash = crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex");
  const recent = recentBrainFlexHashesByUser.get(userId) ?? [];
  recent.unshift(hash);
  recentBrainFlexHashesByUser.set(userId, recent.slice(0, BRAIN_FLEX_HISTORY_WORKSHEETS));

  const words = extractBrainFlexUsedWords(content);
  const recentWords = recentBrainFlexWordsByUser.get(userId) ?? [];
  recentBrainFlexWordsByUser.set(
    userId,
    [...words, ...recentWords].slice(0, BRAIN_FLEX_HISTORY_WORKSHEETS * 8),
  );

  const riddles = extractBrainFlexUsedRiddles(content);
  const recentRiddles = recentBrainFlexRiddlesByUser.get(userId) ?? [];
  recentBrainFlexRiddlesByUser.set(
    userId,
    [...riddles, ...recentRiddles].slice(0, BRAIN_FLEX_HISTORY_WORKSHEETS * 3),
  );

  const teasers = extractBrainFlexUsedBrainTeasers(content);
  const recentTeasers = recentBrainFlexTeasersByUser.get(userId) ?? [];
  recentBrainFlexTeasersByUser.set(
    userId,
    [...teasers, ...recentTeasers].slice(0, BRAIN_FLEX_HISTORY_WORKSHEETS * 3),
  );
}

function fixMissingOperators(obj: any): any {
  if (typeof obj === "string") {
    return obj
      // Fix missing operators between numbers
      .replace(/(\d)\s+(\d)/g, "$1 * $2")
      .replace(/(\d+)\s+(\d+)(?=\s|=)/g, "$1 * $2")

      // Fix 'x' used as multiplication
      .replace(/(\d)\s*x\s*(\d)/gi, "$1 * $2")

      // Replace unicode math symbols
      .replace(/×/g, "*")
      .replace(/÷/g, "/");
  }

  if (Array.isArray(obj)) {
    return obj.map(fixMissingOperators);
  }

  if (typeof obj === "object" && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = fixMissingOperators(obj[key]);
    }
    return newObj;
  }

  return obj;
}

function isOpenAiKeyOrAuthError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    status?: number;
    code?: string;
    error?: { code?: string };
  };
  if (e.status === 401) return true;
  if (e.code === "invalid_api_key") return true;
  if (e.error?.code === "invalid_api_key") return true;
  return false;
}

function sendOpenAiConfigError(res: Response): void {
  res.status(503).json({
    message:
      "OpenAI API key is missing or invalid. Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY in .env, restart the server, then try again. https://platform.openai.com/account/api-keys",
  });
}

function buildBrainFlexResponse(
  body: {
    className: string;
    board?: string;
    difficulty: string;
    puzzleTypeIds: string[];
    subject?: string;
    chapter?: string;
  },
  userId?: number,
) {
  const ctx = makeBrainFlexContext(body, userId);
  return brainFlexContentFromSelection(body.puzzleTypeIds, ctx).then((content) => ({
    ...content,
    grade: body.className,
    difficulty: body.difficulty,
  }));
}

const statePublisherMap: Record<string, string> = {
  "Maharashtra": "Balbharati (Maharashtra State Bureau of Textbook Production and Curriculum Research)",
  "Andhra Pradesh": "SCERT Andhra Pradesh (State Council of Educational Research and Training, AP)",
  "Tamil Nadu": "TN SCERT (Tamil Nadu State Council of Educational Research and Training / Tamil Nadu Textbook and Educational Services Corporation)",
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/db-check", async (_req, res) => {
    try {
      await pool.query("SELECT 1");

      const tables = await pool.query(
        `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
        `,
      );

      return res.json({
        success: true,
        message: "Database connected successfully",
        tables: tables.rows,
      });
    } catch (error) {
      console.error("DB ERROR:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: message,
      });
    }
  });

  app.get("/api/pricing", (_req, res) => {
    res.json(buildPricingApiPayload());
  });

  app.post("/api/create-subscription", (req, res) => {
    const parsed = z
      .object({
        planName: z.string().min(1),
        planType: z.enum(["worksheet"]),
        billingCycle: z.enum(["monthly", "yearly"]).optional(),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const { planName, planType, billingCycle } = parsed.data;

    const resolveAmount = (cycle: BillingCycle | undefined): number | null => {
      const isYearly = cycle === "yearly";
      if (
        planName === pricingPlans.free_2.name ||
        planName.trim().toLowerCase() === "free"
      ) {
        return 0;
      }
      const paidKey = resolvePaidPlanKeyFromPlanName(planName);
      if (!paidKey) return null;
      return isYearly
        ? (pricingPlans[paidKey].yearlyDiscountedPrice ?? pricingPlans[paidKey].yearlyPrice)
        : pricingPlans[paidKey].monthlyPrice;
    };

    const inferredCycle = billingCycle ?? inferBillingCycleFromPlanName(planName) ?? undefined;
    const amount = resolveAmount(inferredCycle);

    if (amount === null) {
      return res.status(400).json({ message: "Unknown plan" });
    }

    return res.json({
      planName,
      planType: planType as PlanType,
      billingCycle: inferredCycle ?? null,
      amount,
    });
  });

  app.post(api.worksheets.generate.path, async (req, res) => {
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const logStage = (stage: string, extra?: Record<string, unknown>) => {
      console.log(`[worksheet.generate:${reqId}] ${stage}`, extra ?? "");
    };

    try {
      logStage("request received", {
        userId: req.isAuthenticated?.() ? req.user?.id : null,
        board: req.body?.board,
        className: req.body?.className,
        subject: req.body?.subject,
        topic: req.body?.topic,
      });

      if (!req.isAuthenticated() || !req.user) {
        logStage("auth failed");
        return res.status(401).json({ message: "Please log in to generate worksheets" });
      }

      const rawBody = req.body;
      const questionTypes: string[] = rawBody.questionTypes || [];
      const ncertBook: string | undefined = rawBody.ncertBook;
      const selectedNoteIds: number[] = Array.isArray(rawBody.selectedNoteIds) ? rawBody.selectedNoteIds.map(Number).filter(Boolean) : [];
      const watermark = normalizeWatermark(rawBody.watermark);
      const { questionTypes: _qt, ncertBook: _nb, selectedNoteIds: _sni, watermark: _wm, ...worksheetBody } = rawBody;
      const input = api.worksheets.generate.input.parse(worksheetBody);
      const userId = req.user.id;
      logStage("validation completed", { userId, board: input.board, length: input.length });

      if (input.board === "Other") {
        logStage("validation failed: other board name missing");
        return res.status(400).json({
          message: "Enter a board name",
          field: "board",
        });
      }

      const quotaErr = await ensureWorksheetQuota(userId);
      if (quotaErr) {
        return res.status(quotaErr.status).json({ message: quotaErr.message });
      }

      const isYoungClass = ["Nursery", "KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"].includes(input.className);

      const questionTypeMap: Record<string, string> = {
        mcq: "mcq (Multiple Choice Questions with 4 options)",
        fill_blanks: "fill_blanks (Fill in the Blanks)",
        true_false: "true_false (True or False statements - use mcq type with options ['True', 'False'])",
        one_word: "one_word (One Word Answer questions - use short_answer type with answerSpaceLines: 1)",
        application_based: "application_based (Application-Based Questions - real-world scenarios, case studies, and problem-solving situations where students apply their knowledge to practical, everyday contexts)",
        short_answer: "short_answer (Short Answer Questions)",
        long_answer: "long_answer (Long Answer Questions)",
        match: "match (Match the Following with matchPairs)",
        identify_sketch: "identify_sketch (Identify from Sketch - describe a simple sketch or diagram in words within the question text, then ask the student to identify what it represents. Use section type 'short_answer' with answerSpaceLines: 2. The question should say something like 'Look at the sketch described below:' followed by a textual description of a simple line drawing or diagram, then ask 'What does this sketch represent?' or 'Identify the parts labeled A, B, C.')",
      };

      const requestedTypes = questionTypes.length > 0
        ? `\nREQUIRED QUESTION TYPES: The worksheet MUST include sections for ONLY these question types: ${questionTypes.map(t => questionTypeMap[t] || t).join(", ")}. Distribute the questions across these types.`
        : "";

      const isStateBoardInput = input.board.startsWith("State Board -");
      const stateBoardName = isStateBoardInput ? input.board.replace("State Board - ", "") : "";
      const publisher = statePublisherMap[stateBoardName] || "";
      const textbookLabel = ncertBook
        ? (isStateBoardInput ? `\nState Board Textbook: ${ncertBook} (Published by: ${publisher})` : `\nNCERT Textbook: ${ncertBook}`)
        : '';
      const chapterRef = input.chapter || input.topic || "Not specified";

      const stateBoardInstruction = isStateBoardInput && ncertBook
        ? `\nCRITICAL STATE BOARD INSTRUCTION:
This worksheet MUST be based EXCLUSIVELY on the official ${stateBoardName} state board textbook "${ncertBook}" published by ${publisher} for ${input.className}.
Chapter/Lesson: "${chapterRef}"

You MUST follow these rules strictly:
1. Every question must come DIRECTLY from the content, stories, poems, exercises, examples, and concepts taught in this SPECIFIC chapter of this SPECIFIC textbook.
2. Use the EXACT characters, plots, settings, themes, moral lessons, vocabulary, definitions, formulas, diagrams, and terminology as they appear in the textbook chapter.
3. For literature/language chapters (stories, poems, prose): Reference the actual characters by name, actual events in the story/poem, actual dialogues, actual moral/message, and actual comprehension questions from the textbook.
4. For Science/Math chapters: Use the exact definitions, theorems, formulas, worked examples, and exercise problems as given in the textbook.
5. Do NOT generate generic questions on the topic. Every question must be answerable ONLY by someone who has read this specific chapter from this specific textbook.
6. Include questions that test recall of specific details from the chapter (e.g., "What did [character name] do when...?", "According to the lesson, what is...?", "In the poem, the poet describes...").
7. For answer keys, provide answers exactly as they would be found in the textbook.
8. If the chapter is a story/narrative, include questions about: main characters, setting, plot events, climax, resolution, moral/message, new vocabulary from the lesson, and author (if mentioned).
9. If the chapter is a poem, include questions about: poet name, rhyme scheme, figures of speech used, central theme, stanza-wise meaning, and difficult words from the poem.
10. For language subjects (English, Hindi, Marathi, Telugu, Tamil), ALWAYS include grammar questions relevant to the chapter: parts of speech, tenses, sentence transformation, active/passive voice, direct/indirect speech, synonyms/antonyms, word meanings, spelling, punctuation, and any grammar exercises from the textbook chapter. Include vocabulary from the chapter with meanings.
11. For Social Science/Social Studies, include map-based questions, timeline questions, and questions about key personalities, dates, events, and their significance as covered in the textbook.`
        : '';

      const isLanguageSubject = ["english", "hindi", "marathi", "telugu", "tamil", "sanskrit", "urdu"].includes(input.subject.toLowerCase());
      const ncertInstruction = !isStateBoardInput && ncertBook
        ? `\nCRITICAL: This worksheet MUST be based STRICTLY on the content from the NCERT textbook "${ncertBook}" for ${input.className} ${input.board}. The chapter "${chapterRef}" is from this specific textbook. All questions, concepts, terminology, examples, and answers must come directly from this textbook chapter. Do NOT use content from other sources or make up questions that are not covered in this chapter. Follow the exact syllabus, definitions, and explanations as given in the prescribed textbook.${isLanguageSubject ? ' For language chapters, include grammar questions (tenses, parts of speech, active/passive voice, direct/indirect speech, sentence transformation, synonyms/antonyms) and vocabulary from the chapter with meanings.' : ''}`
        : '';

      const textbookInstruction = stateBoardInstruction || ncertInstruction;

      let myNotesContext = "";
      if (selectedNoteIds.length > 0) {
        const noteRecords = await storage.getContentUploadsByIds(userId, selectedNoteIds);
        if (noteRecords.length > 0) {
          const noteTexts = noteRecords.map((n, i) => {
            const label = [n.subject, n.chapter, n.topic].filter(Boolean).join(" — ");
            return `[Note ${i + 1}: ${label}]\n${n.extractedText}`;
          }).join("\n\n---\n\n");
          myNotesContext = `\n\nUSER'S TEXTBOOK NOTES (use these as the PRIMARY source for questions):\n${noteTexts}\n\nIMPORTANT: The questions MUST be based on the above textbook notes provided by the user. Use the exact content, examples, definitions, and terminology from these notes. Do not invent questions that aren't covered by this material.`;
        }
      }

      const prompt = `Generate a printable educational worksheet with the following requirements:
Class/Standard: ${input.className}
Education Board: ${input.board}
Subject: ${input.subject}${textbookLabel}
Chapter: ${input.chapter || "Not specified"}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Approximate Number of questions: ${Math.min(input.length ?? 10, 30)}${requestedTypes}${textbookInstruction}${myNotesContext}

The output must be strictly in JSON format matching this structure:
{
  "title": "Worksheet Title",
  "instructions": "General instructions for the student",
  "graphics": [
    {
      "description": "A simple, child-friendly, colorful line-art or minimalist illustration related to the topic",
      "position": "top-right" | "bottom-left" | "between-sections",
      "altText": "Short description of the graphic"
    }
  ],
  ${isYoungClass ? '"graphicEmojis": ["🌻", "🐝", "🌈", "📚", "✏️"],' : ''}
  "sections": [
    {
      "type": "mcq" | "fill_blanks" | "short_answer" | "long_answer" | "match",
      "title": "Section Title (e.g., Multiple Choice Questions)",
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answerSpaceLines": 2,
          "matchPairs": [
            { "left": "Item from Column A", "right": "Matching item from Column B" }
          ]
        }
      ]
    }
  ],
  "answerKey": [
    {
      "sectionIndex": 0,
      "questionIndex": 0,
      "answer": "The correct answer"
    }
  ]
}

IMPORTANT RULES:
1. Include 2-3 colorful, minimalist, education-themed graphic descriptions relevant to the topic.
2. For "match" type questions: Use the "matchPairs" array with left/right pairs. Do NOT use "options" for match type. Each question should have 4-6 matchPairs.
3. For "fill_blanks" type: set answerSpaceLines to 0 (the blank is inline).
4. For "short_answer" type: set answerSpaceLines to 1-2 max (keep compact).
5. For "long_answer" type: set answerSpaceLines to 3-4 max.
6. For "mcq" type: set answerSpaceLines to 0.
7. For "true_false" type: use "mcq" as the section type with options ["True", "False"] only.
8. For "one_word" type: use "short_answer" as the section type with title indicating "One Word Answer" and answerSpaceLines: 1.
9. For "application_based" type: use "long_answer" as the section type with title "Application Based Questions". Each question must present a real-world scenario, everyday situation, or mini case-study related to the topic, then ask the student to apply their knowledge to analyze, solve, or explain it. Questions should start with phrases like "Rohit notices that...", "A farmer observes...", "In a science experiment...", "You are given a situation where...". Set answerSpaceLines to 4.
10. For "identify_sketch" type: use "short_answer" as the section type with title "Identify from Sketch". Each question must describe a simple sketch or diagram in words (e.g., "A sketch shows a plant with arrows pointing to different parts labeled A, B, C, D"), then ask the student to identify or label the parts. Set answerSpaceLines to 2.
11. Use only ASCII math operators in all questions/answers: use +, -, *, / (NOT ×, ÷, or Unicode minus −). Write "sqrt" (NOT √) and "pi" (NOT π).

CRITICAL FORMATTING RULES:
- Always use "*" for multiplication
- Always use "/" for division
- NEVER write numbers like "5 3"
- ALWAYS write "5 * 3"

Examples:
Correct: 4 * 5 = 20
Wrong: 4 5 = 20
12. Generate a COMPLETE answerKey for ALL questions in ALL sections. The answer field should contain the correct answer text.
13. Make the worksheet compact and well-organized to fit maximum content on A4 paper.
14. Ensure questions are strictly aligned with the specified board syllabus, NCERT textbook (if specified), and appropriate for the class level. When an NCERT textbook is specified, ALL questions must come from that specific textbook's chapter content — use the same terminology, definitions, diagrams, and examples as in the textbook.
15. Maximum number of questions is 30. Do not exceed this limit.
 ${isYoungClass ? `16. This is for a YOUNG LEARNER (${input.className}). Include a "graphicEmojis" array with 3-5 fun, relevant emoji characters that match the topic (e.g. animals 🐕🐈, fruits 🍎🍌, shapes 🔵🔺). These will be displayed as decorative elements.
17. For Nursery, KG 1, and KG 2 classes: Focus on age-appropriate activities like tracing, coloring prompts, simple matching, picture identification, basic counting (1-20), letter recognition, number recognition, and simple patterns. Use very simple, child-friendly language. Keep questions short and visual.` : ''}`;

      logStage("openai request started", { model: "gpt-5.1", promptChars: prompt.length });
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert Indian educator who designs high-quality, syllabus-aligned worksheets based on NCERT, Balbharati (Maharashtra), SCERT AP (Andhra Pradesh), TN SCERT (Tamil Nadu), and other board-prescribed textbooks. When a textbook and chapter are specified, you MUST generate questions strictly from that specific chapter's content — use the exact concepts, definitions, examples, exercises, and terminology from the textbook. Do NOT generate generic or random questions. Always include a complete answer key." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });
      logStage("openai response received", {
        finishReason: response.choices[0]?.finish_reason,
        contentChars: response.choices[0]?.message?.content?.length ?? 0,
      });

      const content = JSON.parse(response.choices[0]?.message?.content || "{}");
      const fixedContent = fixMissingOperators(content);

      // Attach custom watermark config (stored inside content JSON). When absent,
      // the default Qik Worksheets watermark behaviour is preserved unchanged.
      if (watermark && fixedContent && typeof fixedContent === "object") {
        fixedContent.watermark = watermark;
      }

      logStage("saving worksheet to database");
      const worksheet = await storage.createWorksheet(input, fixedContent, userId);
      logAnswerKeySaved(worksheet, "worksheets/generate");

      const recordErr = await recordWorksheetGeneration(userId, worksheet.id);
      if (recordErr) {
        return res.status(recordErr.status).json({ message: recordErr.message });
      }

      void logUserActivity(userId, "GENERATE_WORKSHEET", worksheet.id, {
        subject: input.subject,
        className: input.className,
        topic: input.topic,
      }).catch(() => {});

      logStage("response sent", { worksheetId: worksheet.id });
      res.status(200).json(worksheet);
    } catch (err) {
      console.error(`[worksheet.generate:${reqId}] error`, err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (isOpenAiKeyOrAuthError(err)) {
        return sendOpenAiConfigError(res);
      }
      res.status(500).json({ message: "Failed to generate worksheet" });
    }
  });

  // Simple “prompt → text” worksheet generation endpoint (Responses API).
  // This is intentionally separate from the structured JSON worksheet generator above.
  app.post("/api/worksheet/generate", async (req, res) => {
    try {
      const parsed = z
        .object({ 
          prompt: z.string().min(1, "prompt is required"),
          model: z.string().min(1).optional(),
        })
        .safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid payload" });
      }

      const result = await generateWorksheet(parsed.data.prompt, { model: parsed.data.model });
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error("Error generating worksheet (simple):", err);
      if (isOpenAiKeyOrAuthError(err)) {
        return sendOpenAiConfigError(res);
      }
      return res.status(500).json({ message: "Failed to generate worksheet" });
    }
  });

  app.get(api.worksheets.get.path, async (req, res) => {
    const worksheet = await storage.getWorksheet(Number(req.params.id));
    if (!worksheet) {
      return res.status(404).json({ message: 'Worksheet not found' });
    }
    res.json(worksheet);
  });

  app.get(api.answerKey.get.path, async (req, res) => {
    const worksheetId = Number(req.params.id);
    const apiUrl = `/api/answer-key/${req.params.id}`;

    if (!Number.isFinite(worksheetId)) {
      console.warn("[answer-key] lookup invalid id", { rawId: req.params.id, apiUrl });
      return res.status(400).json({ message: "Invalid worksheet id" });
    }

    const worksheet = await storage.getWorksheet(worksheetId);
    const hasKey = worksheet
      ? hasAnswerKeyInContent(worksheet.content, worksheet.worksheetType)
      : false;
    const entryCount = worksheet
      ? countAnswerKeyEntries(worksheet.content, worksheet.worksheetType)
      : 0;

    console.log("[answer-key] lookup", {
      worksheetId,
      apiUrl,
      qrPath: getAnswerKeyPath(worksheetId),
      found: Boolean(worksheet),
      hasAnswerKey: hasKey,
      answerKeyEntryCount: entryCount,
      worksheetType: worksheet?.worksheetType ?? null,
      serialNumber: worksheet?.serialNumber ?? null,
    });

    if (!worksheet) {
      return res.status(404).json({ message: "Answer key not found" });
    }

    if (!hasKey) {
      console.warn(
        `[answer-key] worksheet ${worksheetId} exists but has no answer key content in DB`,
      );
    }

    res.json(worksheet);
  });

  // Used by the client after it saves a PDF locally (download is client-side).
  app.post("/api/worksheets/:id/download", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in" });
      }
      const worksheetId = Number(req.params.id);
      if (!Number.isFinite(worksheetId)) {
        return res.status(400).json({ message: "Invalid worksheet id" });
      }

      const worksheet = await storage.getWorksheet(worksheetId);
      if (!worksheet) {
        return res.status(404).json({ message: "Worksheet not found" });
      }
      if (worksheet.userId && worksheet.userId !== req.user.id) {
        return res.status(403).json({ message: "Not allowed" });
      }

      void logUserActivity(req.user.id, "DOWNLOAD_WORKSHEET", worksheetId).catch(() => {});
      return res.json({ success: true });
    } catch (err) {
      console.error("Worksheet download log error:", err);
      return res.status(500).json({ message: "Failed to log download" });
    }
  });

  app.post("/api/worksheets/:id/rate", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to rate worksheets" });
      }
      const id = Number(req.params.id);
      const { rating } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      const worksheet = await storage.rateWorksheet(id, rating);
      if (!worksheet) {
        return res.status(404).json({ message: "Worksheet not found" });
      }
      res.json(worksheet);
    } catch (err) {
      res.status(500).json({ message: "Failed to rate worksheet" });
    }
  });

  app.post("/api/worksheets/:id/verify-answer-password", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in" });
      }
      const { password } = req.body;
      const answerPassword = process.env.ANSWER_KEY_PASSWORD || "qikws2024";
      if (password === answerPassword) {
        return res.json({ authorized: true });
      }
      return res.status(403).json({ authorized: false, message: "Incorrect password" });
    } catch (err) {
      res.status(500).json({ message: "Failed to verify password" });
    }
  });

  app.post("/api/test-prep/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to generate test papers" });
      }

      const schema = z.object({
        className: z.string().min(1),
        board: z.string().min(1),
        subject: z.string().min(1),
        topics: z.array(z.string()).min(1),
        marksScheme: z.enum(["20", "50", "80"]),
        difficulty: z.string().min(1),
        selectedNoteIds: z.array(z.number()).optional(),
        ncertBook: z.string().optional(),
      });

      const { selectedNoteIds: testNoteIds, ncertBook: testNcertBook, ...inputRest } = schema.parse(req.body);
      const input = inputRest;
      const userId = req.user.id;

      let myNotesContext = "";
      if (testNoteIds && testNoteIds.length > 0) {
        const noteRecords = await storage.getContentUploadsByIds(userId, testNoteIds);
        if (noteRecords.length > 0) {
          myNotesContext = `\n\nUSER'S TEXTBOOK NOTES (use as PRIMARY source for test questions):\n${noteRecords.map((n, i) => `--- Note ${i + 1} [${n.chapter || n.topic || n.subject}] ---\n${n.extractedText}`).join("\n\n")}`;
        }
      }

      const quotaErr = await ensureWorksheetQuota(userId);
      if (quotaErr) {
        return res.status(quotaErr.status).json({ message: quotaErr.message });
      }

      const totalMarks = parseInt(input.marksScheme);
      const topicsList = input.topics.join(", ");

      const prompt = `Generate a structured test paper / examination paper with the following requirements:
Class/Standard: ${input.className}
Education Board: ${input.board}
Subject: ${input.subject}
Topics to cover: ${topicsList}
Total Marks: ${totalMarks}
Difficulty: ${input.difficulty}${testNcertBook ? `\nNCERT/Prescribed Textbook: ${testNcertBook} — Generate all questions strictly aligned to this textbook's content and terminology.` : ""}${myNotesContext}

The output must be strictly in JSON format matching this structure:
{
  "title": "Test Paper Title (e.g., ${input.subject} - Unit Test)",
  "instructions": "General instructions for the student including total marks (${totalMarks} marks), time allowed, and answering guidelines",
  "sections": [
    {
      "type": "mcq" | "fill_blanks" | "short_answer" | "long_answer" | "match",
      "title": "Section Title with marks (e.g., Section A - Multiple Choice Questions [1 mark each])",
      "questions": [
        {
          "question": "The question text [Marks: X]",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answerSpaceLines": 2,
          "matchPairs": [
            { "left": "Item from Column A", "right": "Matching item from Column B" }
          ],
          "marks": 1
        }
      ]
    }
  ],
  "answerKey": [
    {
      "sectionIndex": 0,
      "questionIndex": 0,
      "answer": "The correct answer"
    }
  ]
}

IMPORTANT RULES:
1. The TOTAL marks of ALL questions across ALL sections MUST add up to exactly ${totalMarks} marks.
2. Distribute questions across the provided topics: ${topicsList}
3. Structure the test with increasing difficulty sections:
   - Section A: Objective questions (MCQ, fill blanks) - 1 mark each
   - Section B: Short answer questions - 2-3 marks each
   - Section C: Long answer questions - 4-5 marks each
4. Each question MUST have a "marks" field indicating marks allocated.
5. Include "[Marks: X]" at the end of each question text.
6. For "match" type questions: Use the "matchPairs" array with left/right pairs.
7. For "fill_blanks" type: set answerSpaceLines to 0.
8. For "short_answer" type: set answerSpaceLines to 2.
9. For "long_answer" type: set answerSpaceLines to 4.
10. For "mcq" type: set answerSpaceLines to 0.
11. Generate a COMPLETE answerKey for ALL questions.
12. Ensure questions are aligned with the ${input.board} syllabus for ${input.className}.
13. Make it look like a proper school examination paper with clear section divisions.

CRITICAL FORMATTING RULES:
- Always use "*" for multiplication
- Always use "/" for division
- NEVER write numbers like "5 3"
- ALWAYS write "5 * 3"

Examples:
Correct: 4 * 5 = 20
Wrong: 4 5 = 20
${input.board.startsWith("State Board -") ? `14. CRITICAL: This is a ${input.board.replace("State Board - ", "")} state board test. All questions MUST be based on the official prescribed textbooks published by ${statePublisherMap[input.board.replace("State Board - ", "")] || "the state board"}. Use actual content, terminology, examples, and exercises from the textbooks. Questions must be answerable by students who have studied these specific textbooks.` : ''}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert Indian educator who designs structured examination papers with proper marks distribution based on NCERT, Balbharati (Maharashtra), SCERT AP (Andhra Pradesh), TN SCERT (Tamil Nadu), and other board-prescribed textbooks. Always ensure total marks match the required scheme exactly. When a specific state board is mentioned, generate questions strictly from the official prescribed textbooks of that board." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const content = JSON.parse(response.choices[0]?.message?.content || "{}");
      const fixedContent = fixMissingOperators(content);

      const worksheetInput = {
        className: input.className,
        board: input.board,
        subject: input.subject,
        topic: `Test Prep - ${input.subject}`,
        difficulty: input.difficulty,
        length: totalMarks,
        colorMode: "bw" as const,
        worksheetType: "test_prep" as const,
      };

      const worksheet = await storage.createWorksheet(worksheetInput, fixedContent, userId);
      logAnswerKeySaved(worksheet, "test-prep/generate");
      const recordErr = await recordWorksheetGeneration(userId, worksheet.id);
      if (recordErr) {
        return res.status(recordErr.status).json({ message: recordErr.message });
      }

      res.status(200).json(worksheet);
    } catch (err) {
      console.error("Error generating test paper:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (isOpenAiKeyOrAuthError(err)) {
        return sendOpenAiConfigError(res);
      }
      res.status(500).json({ message: "Failed to generate test paper" });
    }
  });

  app.post("/api/brain-flex/save", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to save Brain-Flex entries" });
      }
      const userId = req.user.id;
      const quotaErr = await ensureWorksheetQuota(userId);
      if (quotaErr) {
        return res.status(quotaErr.status).json({ message: quotaErr.message });
      }

      const schema = z.object({
        className: z.string().min(1),
        board: z.string().optional().default(""),
        subject: z.string().optional().default(""),
        chapter: z.string().optional().default(""),
        puzzleTypeIds: z.array(z.string()).min(1),
        difficulty: z.string().min(1),
      });
      const body = schema.parse(req.body);
      if (isBrainFlexRestrictedSubject(body.subject)) {
        return res.status(403).json({ message: BRAIN_FLEX_RESTRICTED_SUBJECT_MESSAGE });
      }
      console.log("[brain-flex/save] request body:", body);

      const content = await buildBrainFlexResponse(body, userId);
      recordBrainFlexGeneration(userId, content);
      console.log("Generated Brain-Flex sections:", content.sections);
      console.log("[brain-flex/save] full content:", content);

      // Create a real worksheet row so the worksheet page can render it
      const worksheetInput = {
        className: body.className,
        board: body.board || "GEN",
        subject: body.subject || "Brain Flex",
        topic: content.title,
        chapter: body.chapter || "",
        difficulty: body.difficulty,
        length: content.sections.length,
        colorMode: "bw" as const,
        worksheetType: "brain_flex" as const,
      };

      const worksheet = await storage.createWorksheet(
        worksheetInput,
        { instructions: "", ...content },
        userId,
      );
      logAnswerKeySaved(worksheet, "brain-flex/save");
      const recordErr = await recordWorksheetGeneration(userId, worksheet.id);
      if (recordErr) {
        return res.status(recordErr.status).json({ message: recordErr.message });
      }

      const [inserted] = await db
        .insert(brainflexWorksheets)
        .values({
          userId,
          className: body.className,
          board: body.board,
          subject: body.subject,
          chapter: body.chapter || "",
          difficulty: body.difficulty,
          puzzleTypes: body.puzzleTypeIds,
          generatedContent: content as Record<string, unknown>,
        })
        .returning({ id: brainflexWorksheets.id });

      console.log("[brain-flex/save] DB insert result:", inserted, "worksheet:", { id: worksheet.id });

      return res.status(200).json({
        id: worksheet.id,
        type: "brain-flex",
        content,
      });
    } catch (err) {
      console.error("Error saving Brain-Flex:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      return res.status(500).json({ message: "Failed to generate worksheet" });
    }
  });

  app.post("/api/brain-flex/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to generate Brain-Flex worksheets" });
      }
      const userId = req.user.id;
      const quotaErr = await ensureWorksheetQuota(userId);
      if (quotaErr) {
        return res.status(quotaErr.status).json({ message: quotaErr.message });
      }

      const schema = z.object({
        className: z.string().min(1),
        board: z.string().optional().default(""),
        subject: z.string().optional().default(""),
        chapter: z.string().optional().default(""),
        puzzleTypeIds: z.array(z.string()).min(1),
        difficulty: z.string().min(1),
      });
      const body = schema.parse(req.body);
      if (isBrainFlexRestrictedSubject(body.subject)) {
        return res.status(403).json({ message: BRAIN_FLEX_RESTRICTED_SUBJECT_MESSAGE });
      }
      const { className, board, subject, chapter, puzzleTypeIds, difficulty } = body;

      let content: Awaited<ReturnType<typeof brainFlexContentFromSelection>> | undefined;
      const ctx = makeBrainFlexContext({ board, className, subject, chapter }, userId);

      // Regenerate if we accidentally repeat a recent generation for this user.
      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        ctx.excludeWords = recentBrainFlexWordsByUser.get(userId) ?? [];
        ctx.excludeRiddles = recentBrainFlexRiddlesByUser.get(userId) ?? [];
        ctx.excludeBrainTeasers = recentBrainFlexTeasersByUser.get(userId) ?? [];
        const next = await brainFlexContentFromSelection(puzzleTypeIds, ctx);

        const hash = crypto.createHash("sha256").update(JSON.stringify(next)).digest("hex");
        const recent = recentBrainFlexHashesByUser.get(userId) ?? [];
        if (!recent.includes(hash)) {
          recordBrainFlexGeneration(userId, next);
          content = next;
          break;
        }
      }

      if (!content) {
        content = await brainFlexContentFromSelection(puzzleTypeIds, ctx);
        recordBrainFlexGeneration(userId, content);
      }

      console.log("Generated Brain-Flex sections:", content.sections);
      console.log("BrainFlex Content:", content);

      const worksheet = await storage.createWorksheet(
        {
          className,
          board,
          subject,
          chapter,
          difficulty,
          worksheetType: "brain_flex",
          topic: content.title,
          length: content.sections.length,
          colorMode: "bw",
        },
        content,
        userId,
      );
      logAnswerKeySaved(worksheet, "brain-flex/generate");
      const recordErr = await recordWorksheetGeneration(userId, worksheet.id);
      if (recordErr) {
        return res.status(recordErr.status).json({ message: recordErr.message });
      }

      return res.json({ id: worksheet.id });
    } catch (err) {
      console.error("Error generating Brain-Flex:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      return res.status(500).json({ message: "Failed to generate worksheet" });
    }
  });

  app.get("/api/user/worksheets", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const worksheets = await storage.getUserWorksheets(req.user.id);
    res.json(worksheets);
  });

  registerPaymentRoutes(app);
  registerQuestionPaperRoutes(app);

  app.post("/api/content/upload", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { board, className, subject, chapter, topic, sourceDescription, images } = req.body;
      if (!board || !className || !subject || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ message: "board, className, subject, and at least one image are required" });
      }
      if (images.length > 20) {
        return res.status(400).json({ message: "Maximum 20 images per upload" });
      }

      const extractedParts: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const { base64, mimeType } = images[i];
        if (!base64) continue;
        const dataUrl = base64.startsWith("data:") ? base64 : `data:${mimeType || "image/jpeg"};base64,${base64}`;
        try {
          const visionRes = await openai.chat.completions.create({
            model: "gpt-4o",
            max_tokens: 4000,
            messages: [{
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract all text content from this textbook page image. This is page ${i + 1} of ${images.length} from ${subject} (${board}, ${className}). Preserve headings, definitions, examples, and structure. Clean up any OCR artifacts. Return the extracted text only, no commentary.`,
                },
                {
                  type: "image_url",
                  image_url: { url: dataUrl, detail: "high" },
                },
              ],
            }],
          });
          const text = visionRes.choices[0]?.message?.content?.trim();
          if (text) extractedParts.push(`[Page ${i + 1}]\n${text}`);
        } catch (ocrErr) {
          console.error(`[Content] OCR failed for image ${i + 1}:`, ocrErr);
        }
      }

      if (extractedParts.length === 0) {
        return res.status(422).json({ message: "Could not extract text from the uploaded images. Please try with clearer images." });
      }

      const extractedText = extractedParts.join("\n\n---\n\n");
      const record = await storage.createContentUpload(req.user.id, {
        board,
        className,
        subject,
        chapter: chapter || "",
        topic: topic || "",
        extractedText,
        sourceDescription: sourceDescription || "",
        pageCount: images.length,
      });

      return res.status(201).json(record);
    } catch (err) {
      console.error("[Content] Upload error:", err);
      return res.status(500).json({ message: "Content upload failed. Please try again." });
    }
  });

  app.post("/api/content/save-text", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { board, className, subject, chapter, topic, text, sourceDescription } = req.body;
      if (!board || !className || !subject || !text || text.trim().length < 10) {
        return res.status(400).json({ message: "Board, class, subject and text content are required (min 10 characters)." });
      }
      const record = await storage.createContentUpload(req.user.id, {
        board,
        className,
        subject,
        chapter: chapter || "",
        topic: topic || "",
        extractedText: text.trim(),
        sourceDescription: sourceDescription || "Typed notes",
        pageCount: 0,
      });
      return res.status(201).json(record);
    } catch (err) {
      console.error("[Content] Save-text error:", err);
      return res.status(500).json({ message: "Failed to save notes. Please try again." });
    }
  });

  app.get("/api/content", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const uploads = await storage.getUserContentUploads(req.user.id);
      return res.json(uploads);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.delete("/api/content/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const deleted = await storage.deleteContentUpload(id, req.user.id);
      if (!deleted) return res.status(404).json({ message: "Content not found" });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Delete failed" });
    }
  });

  app.get("/api/content/context", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { className, subject, topic } = req.query;
      if (!className || !subject) return res.status(400).json({ message: "className and subject are required" });
      const results = await storage.searchContentUploads(
        req.user.id,
        String(className),
        String(subject),
        topic ? String(topic) : undefined
      );
      const hasContent = results.length > 0;
      const combinedText = results.map(r => r.extractedText).join("\n\n---\n\n");
      return res.json({ hasContent, content: combinedText, count: results.length });
    } catch (err) {
      return res.status(500).json({ message: "Context search failed" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const adminKey = process.env.ADMIN_SECRET_KEY;
      if (!adminKey) {
        return res.status(503).json({ message: "Admin functionality not configured." });
      }
      const provided = req.headers["x-admin-key"] as string | undefined;
      if (!provided || provided !== adminKey) {
        return res.status(401).json({ message: "Invalid admin key." });
      }
      const [allUsers, activity] = await Promise.all([
        storage.getAllUsersAdmin(),
        storage.getWorksheetActivityLast7Days(),
      ]);
      res.json({
        totalUsers: allUsers.length,
        users: allUsers,
        worksheetActivity: activity,
      });
    } catch (err) {
      console.error("Admin stats error:", err);
      res.status(500).json({ message: "Failed to fetch admin stats." });
    }
  });

  app.get("/api/admin/user-activity/:userId", async (req, res) => {
    try {
      const adminKey = process.env.ADMIN_SECRET_KEY;
      if (!adminKey) {
        return res.status(503).json({ message: "Admin functionality not configured." });
      }
      const provided = req.headers["x-admin-key"] as string | undefined;
      if (!provided || provided !== adminKey) {
        return res.status(401).json({ message: "Invalid admin key." });
      }

      const userId = Number(req.params.userId);
      if (!Number.isFinite(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }

      const rows = await db
        .select()
        .from(userActivityLogs)
        .where(eq(userActivityLogs.userId, userId))
        .orderBy(desc(userActivityLogs.createdAt));

      return res.json({ userId, logs: rows });
    } catch (err) {
      console.error("Admin user activity error:", err);
      return res.status(500).json({ message: "Failed to fetch user activity." });
    }
  });

  return httpServer;
}
