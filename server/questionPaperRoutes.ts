import type { Express, Response } from "express";
import { z } from "zod";
import { openai } from "./openaiClient";

const VISION_MODEL = "gpt-4o";
const GENERATION_MODEL = "gpt-5.1";

function isOpenAiKeyOrAuthError(err: unknown): boolean {
  const e = err as { status?: number; code?: string; error?: { code?: string } };
  if (e?.status === 401) return true;
  if (e?.code === "invalid_api_key") return true;
  if (e?.error?.code === "invalid_api_key") return true;
  return false;
}

function sendOpenAiConfigError(res: Response): void {
  res.status(503).json({
    message:
      "OpenAI API key is missing or invalid. Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY in .env, restart the server, then try again.",
  });
}

const imageSchema = z.object({
  base64: z.string().min(1),
  mimeType: z.string().optional(),
});

const analyzeSchema = z.object({
  board: z.string().min(1),
  className: z.string().min(1),
  subject: z.string().min(1),
  images: z.array(imageSchema).min(1).max(25),
});

const layoutProfileSchema = z.object({
  style: z.enum(["generic", "nested_board"]).default("generic"),
  showSeatNo: z.boolean().optional().default(false),
  paperCodeLine: z.string().optional(),
  timeMarksLine: z.string().optional(),
  instructionsPrefix: z.string().optional().default("Note :—"),
  mcqOptionStyle: z.enum(["upper_alpha_paren", "lower_alpha_paren"]).optional().default("upper_alpha_paren"),
  subQuestionNumbering: z.enum(["roman_lower", "numeric"]).optional().default("roman_lower"),
  marksOnSectionHeader: z.boolean().optional().default(false),
});

const sectionPlanSchema = z.object({
  name: z.string().default(""),
  description: z.string().optional().default(""),
  questionType: z.string().default(""),
  questionCount: z.coerce.number().default(0),
  marksPerQuestion: z.coerce.number().default(0),
  hasInternalChoice: z.boolean().optional().default(false),
  headerLine: z.string().optional(),
  sectionMarks: z.coerce.number().optional(),
  answerRule: z.string().optional(),
  parentQuestionNumber: z.string().optional(),
  subSectionLetter: z.string().optional(),
});

const analysisSchema = z.object({
  board: z.string().default(""),
  className: z.string().default(""),
  subject: z.string().default(""),
  chapters: z.array(z.string()).default([]),
  totalMarks: z.coerce.number().default(0),
  durationMinutes: z.coerce.number().default(0),
  difficulty: z.string().default("Moderate"),
  generalInstructions: z.array(z.string()).default([]),
  sections: z.array(sectionPlanSchema).default([]),
  detectedQuestionTypes: z.array(z.string()).default([]),
  layoutProfile: layoutProfileSchema.optional(),
  paperCodeLine: z.string().optional(),
  timeMarksLine: z.string().optional(),
});

const generateSchema = z.object({
  board: z.string().min(1),
  className: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().optional().default(""),
  analysis: analysisSchema,
});

type Analysis = z.infer<typeof analysisSchema>;

interface GeneratedQuestion {
  number: string;
  marks: number;
  internalChoice?: string;
}

interface GeneratedSection {
  name: string;
  questions: GeneratedQuestion[];
}

interface GeneratedPaperPayload {
  sections: GeneratedSection[];
}

function toDataUrl(base64: string, mimeType?: string): string {
  if (base64.startsWith("data:")) return base64;
  return `data:${mimeType || "image/jpeg"};base64,${base64}`;
}

function inferNestedBoard(board: string, analysis: Analysis): Analysis {
  const isMaharashtra = /maharashtra/i.test(board);
  const hasNestedHeaders = analysis.sections.some(
    (s) => s.headerLine?.includes("(") || s.parentQuestionNumber || s.subSectionLetter,
  );

  if (!analysis.layoutProfile && (isMaharashtra || hasNestedHeaders)) {
    analysis.layoutProfile = {
      style: "nested_board",
      showSeatNo: true,
      instructionsPrefix: "Note :—",
      mcqOptionStyle: "upper_alpha_paren",
      subQuestionNumbering: "roman_lower",
      marksOnSectionHeader: true,
    };
  }

  if (analysis.layoutProfile?.style === "nested_board") {
    analysis.layoutProfile.marksOnSectionHeader = true;
    if (analysis.layoutProfile.showSeatNo === undefined) analysis.layoutProfile.showSeatNo = true;
  }

  return analysis;
}

function validatePaperStructure(blueprint: Analysis, paper: GeneratedPaperPayload): string[] {
  const errors: string[] = [];
  const marksOnHeader = blueprint.layoutProfile?.marksOnSectionHeader ?? false;

  if (paper.sections.length !== blueprint.sections.length) {
    errors.push(
      `Section count mismatch: blueprint has ${blueprint.sections.length}, generated ${paper.sections.length}`,
    );
  }

  const sectionCount = Math.min(paper.sections.length, blueprint.sections.length);
  for (let i = 0; i < sectionCount; i++) {
    const plan = blueprint.sections[i];
    const section = paper.sections[i];

    if (plan.questionCount !== section.questions.length) {
      errors.push(
        `${plan.name || plan.headerLine}: expected ${plan.questionCount} question(s), got ${section.questions.length}`,
      );
    }

    if (!marksOnHeader) {
      for (let j = 0; j < section.questions.length; j++) {
        const q = section.questions[j];
        if (plan.marksPerQuestion > 0 && q.marks !== plan.marksPerQuestion) {
          errors.push(
            `${plan.name} Q${j + 1}: expected ${plan.marksPerQuestion} mark(s), got ${q.marks}`,
          );
        }
      }
    }

    if (plan.hasInternalChoice) {
      const choiceCount = section.questions.filter((q) => q.internalChoice?.trim()).length;
      if (plan.answerRule === "any one") {
        if (section.questions.length < 2) {
          errors.push(`${plan.headerLine || plan.name}: "any one" section needs at least 2 alternatives`);
        }
      } else if (choiceCount === 0 && section.questions.length > 0) {
        errors.push(`${plan.headerLine || plan.name}: missing internal choice (OR alternative)`);
      }
    }
  }

  return errors;
}

function buildStructureSummary(blueprint: Analysis): string {
  return blueprint.sections
    .map((s, i) => {
      const header = s.headerLine || s.name;
      const marks = s.sectionMarks ?? s.questionCount * s.marksPerQuestion;
      const rule = s.answerRule ? ` (${s.answerRule})` : "";
      return `${i + 1}. "${header}" — ${s.questionCount} sub-questions, ${s.questionType}, ${marks} marks${rule}`;
    })
    .join("\n");
}

function resolveTopicScope(
  topic: string | undefined,
  subject: string,
  className: string,
  analysis: Analysis,
): string {
  const trimmed = topic?.trim();
  if (trimmed) return trimmed;
  if (analysis.chapters.length > 0) return analysis.chapters.join(", ");
  return `the standard ${subject} syllabus for ${className}`;
}

function buildGeneratePrompt(
  board: string,
  className: string,
  subject: string,
  topic: string,
  analysis: Analysis,
  structureErrors?: string[],
): string {
  const isNested = analysis.layoutProfile?.style === "nested_board";
  const blueprint = {
    board,
    className,
    subject,
    totalMarks: analysis.totalMarks,
    durationMinutes: analysis.durationMinutes,
    difficulty: analysis.difficulty,
    generalInstructions: analysis.generalInstructions,
    layoutProfile: analysis.layoutProfile,
    paperCodeLine: analysis.paperCodeLine,
    timeMarksLine: analysis.timeMarksLine,
    sections: analysis.sections,
  };

  const structureLock = buildStructureSummary(analysis);
  const correctionBlock = structureErrors?.length
    ? `\n\nYOUR PREVIOUS OUTPUT FAILED STRUCTURE VALIDATION. Fix these issues:\n${structureErrors.map((e) => `- ${e}`).join("\n")}\n`
    : "";

  const layoutRules = isNested
    ? `
=== PRESENTATION / LAYOUT LOCK (must match sample paper format EXACTLY) ===
- layoutProfile.style MUST be "nested_board"
- Copy paperCodeLine and timeMarksLine from blueprint (adapt year/subject only)
- Each section MUST include headerLine exactly matching blueprint format, e.g.:
  "1 (A) Choose the correct alternative : 5"
  "(A) Give scientific reasons (any two) : 4"
  "Answer the following (any five) : 15"
  "4. Answer any one of the following : 5"
- Sub-questions numbered with roman numerals: "(i)", "(ii)", "(iii)" — NOT "1.", "2."
- MCQ options use UPPERCASE letters: "(A)", "(B)", "(C)", "(D)" on separate lines
- Marks appear ONLY on section headerLine after colon (e.g. ": 5"), NOT as [marks] per question
- Set marks: 0 on each question when marksOnSectionHeader is true
- Match columns: use Column 'A' / Column 'B' labels in matchPairs presentation
- For answerRule "any two/three/five/one": include answerRule on section; student attempts subset
- For "any one" sections: each question is a full alternative with subParts (a)(b)(c)...
- True/False, odd-one-out, match-columns are separate sub-questions within a section
- Preserve parentQuestionNumber and subSectionLetter from blueprint on each section
- generalInstructions use roman numerals (i), (ii), (iii) with prefix "Note :—"
`
    : `
=== PRESENTATION RULES ===
- Use standard section headers and numeric question numbering
- Show marks per question in brackets
`;

  const jsonExample = isNested
    ? `{
  "paper": {
    "title": "string",
    "board": "${board}",
    "className": "${className}",
    "subject": "${subject}",
    "totalMarks": ${analysis.totalMarks || "number"},
    "durationMinutes": ${analysis.durationMinutes || "number"},
    "paperCodeLine": "from blueprint",
    "timeMarksLine": "Time : 2 Hours Max. Marks : ${analysis.totalMarks}",
    "layoutProfile": { "style": "nested_board", "showSeatNo": true, "marksOnSectionHeader": true, "mcqOptionStyle": "upper_alpha_paren", "subQuestionNumbering": "roman_lower", "instructionsPrefix": "Note :—" },
    "generalInstructions": ["(i) All questions are compulsory.", "(ii) ..."],
    "sections": [
      {
        "name": "1 (A)",
        "headerLine": "1 (A) Choose the correct alternative",
        "sectionMarks": 5,
        "answerRule": "all",
        "parentQuestionNumber": "1",
        "subSectionLetter": "A",
        "description": "",
        "questions": [
          {
            "number": "(i)",
            "text": "NEW MCQ question on ${topic}",
            "questionType": "MCQ",
            "marks": 0,
            "options": ["option text A", "option text B", "option text C", "option text D"]
          }
        ]
      },
      {
        "name": "4",
        "headerLine": "4. Answer any one of the following",
        "sectionMarks": 5,
        "answerRule": "any one",
        "hasInternalChoice": true,
        "questions": [
          {
            "number": "(i)",
            "text": "Main question stem",
            "questionType": "Long Answer",
            "marks": 0,
            "subParts": [{ "label": "(a)", "text": "..." }, { "label": "(b)", "text": "..." }]
          },
          {
            "number": "(ii)",
            "text": "Alternative question stem (OR option)",
            "questionType": "Long Answer",
            "marks": 0,
            "subParts": [{ "label": "(a)", "text": "..." }]
          }
        ]
      }
    ]
  },
  "answerKey": [{ "section": "1 (A)", "number": "(i)", "answer": "(A) correct option" }]
}`
    : `{
  "paper": {
    "title": "string",
    "board": "${board}",
    "className": "${className}",
    "subject": "${subject}",
    "totalMarks": ${analysis.totalMarks || "number"},
    "durationMinutes": ${analysis.durationMinutes || "number"},
    "generalInstructions": ["..."],
    "sections": [{ "name": "Section A", "description": "...", "questions": [{ "number": "1", "text": "...", "questionType": "MCQ", "marks": 1, "options": ["..."] }] }]
  },
  "answerKey": [{ "section": "Section A", "number": "1", "answer": "..." }]
}`;

  return `Create a brand-new ${board} ${className} ${subject} question paper.

The uploaded sample paper is ONLY a structural and visual template. Do NOT copy any question text.

=== STRUCTURE LOCK ===
${structureLock}

Total marks: ${analysis.totalMarks}
Duration: ${analysis.durationMinutes} minutes

BLUEPRINT JSON:
${JSON.stringify(blueprint, null, 2)}
${layoutRules}
=== CONTENT RULES ===
1. Subject: "${subject}" only.
2. All questions strictly within: "${topic}".
3. Completely NEW questions — no copying from sample.
4. Match ${className} ${board} difficulty: ${analysis.difficulty}.
5. Same section count, headerLine format, question counts, sectionMarks, answerRule, and question types.
6. Complete answerKey for every sub-question.
${correctionBlock}
Return STRICT JSON:
${jsonExample}

Use ASCII math only (+, -, *, /, sqrt, pi). Return ONLY the JSON object.`;
}

async function callGenerateModel(
  board: string,
  className: string,
  subject: string,
  topic: string,
  analysis: Analysis,
  structureErrors?: string[],
): Promise<any> {
  const systemPrompt =
    "You are an expert Indian board examination paper setter. You replicate the EXACT visual layout and numbering scheme of a sample paper (section headers, roman numerals, MCQ option style, marks placement) while writing completely original questions. You always respond with strict JSON.";

  const completion = await openai.chat.completions.create({
    model: GENERATION_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: buildGeneratePrompt(board, className, subject, topic, analysis, structureErrors),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

function enrichGeneratedPaper(paper: any, analysis: Analysis): any {
  if (!paper.layoutProfile && analysis.layoutProfile) {
    paper.layoutProfile = analysis.layoutProfile;
  }
  if (!paper.paperCodeLine && analysis.paperCodeLine) {
    paper.paperCodeLine = analysis.paperCodeLine;
  }
  if (!paper.timeMarksLine && analysis.timeMarksLine) {
    paper.timeMarksLine = analysis.timeMarksLine;
  }
  if (paper.layoutProfile?.style === "nested_board" && paper.sections) {
    for (let i = 0; i < paper.sections.length; i++) {
      const genSec = paper.sections[i];
      const plan = analysis.sections[i];
      if (plan) {
        if (!genSec.headerLine && plan.headerLine) genSec.headerLine = plan.headerLine;
        if (!genSec.sectionMarks && plan.sectionMarks) genSec.sectionMarks = plan.sectionMarks;
        if (!genSec.answerRule && plan.answerRule) genSec.answerRule = plan.answerRule;
        if (!genSec.parentQuestionNumber && plan.parentQuestionNumber) {
          genSec.parentQuestionNumber = plan.parentQuestionNumber;
        }
        if (!genSec.subSectionLetter && plan.subSectionLetter) {
          genSec.subSectionLetter = plan.subSectionLetter;
        }
      }
    }
  }
  return paper;
}

export function registerQuestionPaperRoutes(app: Express): void {
  app.post("/api/question-papers/analyze", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to analyze question papers" });
      }

      const { board, className, subject, images } = analyzeSchema.parse(req.body);

      const systemPrompt =
        "You are an expert Indian examination analyst. You extract the EXACT structural AND visual layout pattern from board question papers — header format, section header lines, numbering scheme (roman numerals, nested A/B parts), marks placement, and question types. You always respond with strict JSON.";

      const instruction = `Analyze the attached sample ${board} question paper for ${className} ${subject}.

This is a PATTERN/TEMPLATE. Extract structure AND presentation format precisely.

Return STRICT JSON:
{
  "board": "${board}",
  "className": "${className}",
  "subject": "${subject}",
  "chapters": ["topics in sample — reference only"],
  "totalMarks": number,
  "durationMinutes": number,
  "difficulty": "Easy" | "Moderate" | "Hard",
  "paperCodeLine": "full header line e.g. 2025 III 10 1100 – N 840 – SCIENCE AND TECHNOLOGY (72) – PART I (E) (REVISED COURSE)",
  "timeMarksLine": "e.g. Time : 2 Hours (Pages 11) Max. Marks : 40",
  "generalInstructions": ["(i) All questions are compulsory.", "(ii) Use of calculator..."],
  "layoutProfile": {
    "style": "nested_board" | "generic",
    "showSeatNo": boolean,
    "paperCodeLine": "same as above",
    "timeMarksLine": "same as above",
    "instructionsPrefix": "Note :—",
    "mcqOptionStyle": "upper_alpha_paren" | "lower_alpha_paren",
    "subQuestionNumbering": "roman_lower" | "numeric",
    "marksOnSectionHeader": boolean
  },
  "sections": [
    {
      "name": "short id e.g. 1 (A)",
      "headerLine": "EXACT printed line e.g. 1 (A) Choose the correct alternative",
      "description": "section instruction if any",
      "questionType": "MCQ | True/False | Odd One Out | Match the Following | Short Answer | Long Answer | Scientific Reason | Numerical | Diagram Based",
      "questionCount": number,
      "marksPerQuestion": number,
      "sectionMarks": number,
      "answerRule": "all | any two | any three | any five | any one",
      "hasInternalChoice": boolean,
      "parentQuestionNumber": "1 | 2 | 3 | 4",
      "subSectionLetter": "A | B | null"
    }
  ],
  "detectedQuestionTypes": ["..."]
}

CRITICAL layout detection rules:
- Use "nested_board" style when paper has formats like:
  "1 (A) Choose the correct alternative : 5"
  "(A) Give scientific reasons (any two) : 4"
  "Answer the following (any five) : 15"
  "4. Answer any one of the following : 5"
- Sub-questions use roman numerals (i), (ii), (iii) — count each one
- MCQ options use (A), (B), (C), (D) uppercase
- Marks shown after colon on section header (: 5), not per question
- Extract paperCodeLine, timeMarksLine, Seat No. area, Note :— prefix
- For mixed sections like 1(B): count each sub-type (true/false, odd one out, match, short) as separate sub-questions
- Do NOT include actual question text
- Return ONLY JSON`;

      const content: any[] = [{ type: "text", text: instruction }];
      for (const img of images) {
        content.push({
          type: "image_url",
          image_url: { url: toDataUrl(img.base64, img.mimeType), detail: "high" },
        });
      }

      const completion = await openai.chat.completions.create({
        model: VISION_MODEL,
        max_tokens: 6000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content as any },
        ],
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(422).json({
          message: "Could not read the paper structure. Please upload clearer images.",
        });
      }

      let analysis = analysisSchema.parse(parsed);
      analysis.board = board;
      analysis.className = className;
      analysis.subject = subject;
      analysis = inferNestedBoard(board, analysis);

      if (analysis.sections.length === 0) {
        return res.status(422).json({
          message: "Could not detect any sections in the uploaded paper. Please upload clearer pages.",
        });
      }

      return res.json({ analysis });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message || "Invalid request" });
      }
      if (isOpenAiKeyOrAuthError(err)) return sendOpenAiConfigError(res);
      console.error("[QuestionPaper] Analyze error:", err);
      return res.status(500).json({ message: "Failed to analyze the question paper. Please try again." });
    }
  });

  app.post("/api/question-papers/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to generate question papers" });
      }

      let { board, className, subject, topic, analysis } = generateSchema.parse(req.body);
      analysis = inferNestedBoard(board, analysis);
      const topicScope = resolveTopicScope(topic, subject, className, analysis);

      let result: any;
      let structureErrors: string[] = [];

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          result = await callGenerateModel(
            board,
            className,
            subject,
            topicScope,
            analysis,
            attempt > 0 ? structureErrors : undefined,
          );
        } catch {
          return res.status(422).json({ message: "The generated paper was malformed. Please try again." });
        }

        if (!result?.paper?.sections?.length) {
          return res.status(422).json({ message: "Could not generate a valid paper. Please try again." });
        }

        result.paper = enrichGeneratedPaper(result.paper, analysis);
        structureErrors = validatePaperStructure(analysis, result.paper);
        if (structureErrors.length === 0) break;
      }

      if (structureErrors.length > 0) {
        console.warn("[QuestionPaper] Structure validation failed:", structureErrors);
        return res.status(422).json({
          message:
            "Generated paper did not match the uploaded pattern exactly. Please try generating again.",
          structureErrors,
        });
      }

      return res.json({
        paper: result.paper,
        answerKey: Array.isArray(result.answerKey) ? result.answerKey : [],
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message || "Invalid request" });
      }
      if (isOpenAiKeyOrAuthError(err)) return sendOpenAiConfigError(res);
      console.error("[QuestionPaper] Generate error:", err);
      return res.status(500).json({ message: "Failed to generate the question paper. Please try again." });
    }
  });
}
