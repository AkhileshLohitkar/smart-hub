import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { PLAN_CONFIG } from "./planConfig";
import { getRazorpay, getRazorpayKeyId, verifyRazorpaySignature, verifyWebhookSignature } from "./razorpayClient";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const statePublisherMap: Record<string, string> = {
  "Maharashtra": "Balbharati (Maharashtra State Bureau of Textbook Production and Curriculum Research)",
  "Andhra Pradesh": "SCERT Andhra Pradesh (State Council of Educational Research and Training, AP)",
  "Tamil Nadu": "TN SCERT (Tamil Nadu State Council of Educational Research and Training / Tamil Nadu Textbook and Educational Services Corporation)",
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.worksheets.generate.path, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to generate worksheets" });
      }

      const rawBody = req.body;
      const questionTypes: string[] = rawBody.questionTypes || [];
      const ncertBook: string | undefined = rawBody.ncertBook;
      const { questionTypes: _qt, ncertBook: _nb, ...worksheetBody } = rawBody;
      const input = api.worksheets.generate.input.parse(worksheetBody);
      const userId = req.user.id;

      const user = await storage.getUser(userId);
      if (user && user.plan === "free" && user.worksheetsGenerated >= 5) {
        return res.status(403).json({ message: "Free plan limit reached. Please upgrade to continue generating worksheets." });
      }

      const isYoungClass = ["Nursery", "KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"].includes(input.className);

      const questionTypeMap: Record<string, string> = {
        mcq: "mcq (Multiple Choice Questions with 4 options)",
        fill_blanks: "fill_blanks (Fill in the Blanks)",
        true_false: "true_false (True or False statements - use mcq type with options ['True', 'False'])",
        one_word: "one_word (One Word Answer questions - use short_answer type with answerSpaceLines: 1)",
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

      const prompt = `Generate a printable educational worksheet with the following requirements:
Class/Standard: ${input.className}
Education Board: ${input.board}
Subject: ${input.subject}${textbookLabel}
Chapter: ${input.chapter || "Not specified"}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Approximate Number of questions: ${Math.min(input.length, 30)}${requestedTypes}${textbookInstruction}

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
9. For "identify_sketch" type: use "short_answer" as the section type with title "Identify from Sketch". Each question must describe a simple sketch or diagram in words (e.g., "A sketch shows a plant with arrows pointing to different parts labeled A, B, C, D"), then ask the student to identify or label the parts. Set answerSpaceLines to 2.
10. Generate a COMPLETE answerKey for ALL questions in ALL sections. The answer field should contain the correct answer text.
11. Make the worksheet compact and well-organized to fit maximum content on A4 paper.
12. Ensure questions are strictly aligned with the specified board syllabus, NCERT textbook (if specified), and appropriate for the class level. When an NCERT textbook is specified, ALL questions must come from that specific textbook's chapter content — use the same terminology, definitions, diagrams, and examples as in the textbook.
13. Maximum number of questions is 30. Do not exceed this limit.
${isYoungClass ? `14. This is for a YOUNG LEARNER (${input.className}). Include a "graphicEmojis" array with 3-5 fun, relevant emoji characters that match the topic (e.g. animals 🐕🐈, fruits 🍎🍌, shapes 🔵🔺). These will be displayed as decorative elements.
15. For Nursery, KG 1, and KG 2 classes: Focus on age-appropriate activities like tracing, coloring prompts, simple matching, picture identification, basic counting (1-20), letter recognition, number recognition, and simple patterns. Use very simple, child-friendly language. Keep questions short and visual.` : ''}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert Indian educator who designs high-quality, syllabus-aligned worksheets based on NCERT, Balbharati (Maharashtra), SCERT AP (Andhra Pradesh), TN SCERT (Tamil Nadu), and other board-prescribed textbooks. When a textbook and chapter are specified, you MUST generate questions strictly from that specific chapter's content — use the exact concepts, definitions, examples, exercises, and terminology from the textbook. Do NOT generate generic or random questions. Always include a complete answer key." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const content = JSON.parse(response.choices[0]?.message?.content || "{}");
      const worksheet = await storage.createWorksheet(input, content, userId);

      await storage.incrementWorksheetCount(userId);

      res.status(200).json(worksheet);
    } catch (err) {
      console.error("Error generating worksheet:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to generate worksheet" });
    }
  });

  app.get(api.worksheets.get.path, async (req, res) => {
    const worksheet = await storage.getWorksheet(Number(req.params.id));
    if (!worksheet) {
      return res.status(404).json({ message: 'Worksheet not found' });
    }
    res.json(worksheet);
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
      });

      const input = schema.parse(req.body);
      const userId = req.user.id;

      const user = await storage.getUser(userId);
      if (user && user.plan === "free" && user.worksheetsGenerated >= 5) {
        return res.status(403).json({ message: "Free plan limit reached. Please upgrade to continue generating worksheets." });
      }

      const totalMarks = parseInt(input.marksScheme);
      const topicsList = input.topics.join(", ");

      const prompt = `Generate a structured test paper / examination paper with the following requirements:
Class/Standard: ${input.className}
Education Board: ${input.board}
Subject: ${input.subject}
Topics to cover: ${topicsList}
Total Marks: ${totalMarks}
Difficulty: ${input.difficulty}

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

      const worksheet = await storage.createWorksheet(worksheetInput, content, userId);
      await storage.incrementWorksheetCount(userId);

      res.status(200).json(worksheet);
    } catch (err) {
      console.error("Error generating test paper:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to generate test paper" });
    }
  });

  app.get("/api/user/worksheets", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const worksheets = await storage.getUserWorksheets(req.user.id);
    res.json(worksheets);
  });

  app.get("/api/children", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const result = await storage.getChildren(req.user.id);
    res.json(result);
  });

  app.post("/api/children", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { insertChildSchema } = await import("@shared/schema");
      const parsed = insertChildSchema.parse(req.body);
      const existing = await storage.getChildren(req.user.id);
      if (existing.length >= req.user.maxChildren) {
        return res.status(403).json({ message: `Your plan allows a maximum of ${req.user.maxChildren} child profile(s). Please upgrade to add more.` });
      }
      const child = await storage.createChild(parsed, req.user.id);
      res.status(201).json(child);
    } catch (err) {
      console.error("Error creating child:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to add child" });
    }
  });

  app.delete("/api/children/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const deleted = await storage.deleteChild(Number(req.params.id), req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Child not found" });
      }
      res.json({ message: "Child removed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove child" });
    }
  });

  // Razorpay payment routes

  const RAZORPAY_PLANS = [
    { planKey: "starter_monthly", name: "Starter Monthly", amount: 9900, currency: "INR", period: "monthly", description: "₹99/month, 1 child, unlimited worksheets" },
    { planKey: "starter_annual", name: "Starter Annual", amount: 99900, currency: "INR", period: "yearly", description: "₹999/year, 1 child, unlimited worksheets" },
    { planKey: "family_monthly", name: "Family Monthly", amount: 18900, currency: "INR", period: "monthly", description: "₹189/month, 2-3 children, unlimited worksheets" },
    { planKey: "family_annual", name: "Family Annual", amount: 179900, currency: "INR", period: "yearly", description: "₹1,799/year, 2-3 children, unlimited worksheets" },
    { planKey: "no_watermark", name: "No Watermark", amount: 34900, currency: "INR", period: "yearly", description: "₹349/year, unlimited children, no watermark" },
  ];

  app.get("/api/razorpay/key", (_req, res) => {
    try {
      const keyId = getRazorpayKeyId();
      res.json({ keyId });
    } catch {
      res.status(500).json({ message: "Razorpay not configured" });
    }
  });

  app.get("/api/razorpay/plans", (_req, res) => {
    res.json({ plans: RAZORPAY_PLANS });
  });

  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to subscribe" });
      }

      const { planKey } = req.body;
      if (!planKey) {
        return res.status(400).json({ message: "Plan key is required" });
      }

      const plan = RAZORPAY_PLANS.find(p => p.planKey === planKey);
      if (!plan) {
        return res.status(400).json({ message: "Invalid plan" });
      }

      const razorpay = getRazorpay();
      const order = await razorpay.orders.create({
        amount: plan.amount,
        currency: plan.currency,
        receipt: `order_${req.user.id}_${Date.now()}`,
        notes: {
          userId: String(req.user.id),
          planKey: plan.planKey,
        },
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planKey: plan.planKey,
        planName: plan.name,
      });
    } catch (err: any) {
      console.error("Create order error:", err);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing payment details" });
      }

      const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      const razorpay = getRazorpay();
      const order = await razorpay.orders.fetch(razorpay_order_id);

      const planKey = (order.notes as any)?.planKey;
      if (!planKey) {
        return res.status(400).json({ message: "Invalid order: missing plan information" });
      }

      const plan = RAZORPAY_PLANS.find(p => p.planKey === planKey);
      if (!plan || Number(plan.amount) !== Number(order.amount)) {
        return res.status(400).json({ message: "Order amount mismatch" });
      }

      const config = PLAN_CONFIG[planKey] || { plan: "starter", maxChildren: 1 };
      const userId = req.user.id;

      const isAnnual = plan?.period === "yearly";
      const periodEnd = new Date();
      if (isAnnual) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await storage.updateRazorpayCustomerId(userId, razorpay_payment_id);
      await storage.updateUserPlan(userId, config.plan, config.maxChildren, periodEnd);

      const updatedUser = await storage.getUser(userId);
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      console.error("Verify payment error:", err);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  app.get("/api/razorpay/subscription", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.user.id);
      res.json({
        plan: user?.plan || "free",
        planExpiresAt: user?.planExpiresAt || null,
        razorpayCustomerId: user?.razorpayCustomerId || null,
      });
    } catch {
      res.json({ plan: "free", planExpiresAt: null });
    }
  });

  app.post("/api/razorpay/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string | undefined;
      const rawBody = (req as any).rawBody as string | undefined;

      if (!signature || !rawBody) {
        return res.status(400).json({ message: "Missing signature or body" });
      }

      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error("[Webhook] Invalid Razorpay webhook signature");
        return res.status(400).json({ message: "Invalid signature" });
      }

      const event = req.body;
      const eventName: string = event?.event;

      if (eventName === "payment.captured" || eventName === "order.paid") {
        const orderId: string =
          event?.payload?.payment?.entity?.order_id ||
          event?.payload?.order?.entity?.id;

        if (!orderId) {
          return res.status(200).json({ status: "ignored - no order id" });
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.fetch(orderId);
        const planKey = (order.notes as any)?.planKey;
        const userId = parseInt((order.notes as any)?.userId || "0", 10);

        if (!planKey || !userId) {
          console.error(`[Webhook] Missing planKey or userId in order notes for ${orderId}`);
          return res.status(200).json({ status: "ignored - missing notes" });
        }

        const plan = RAZORPAY_PLANS.find((p) => p.planKey === planKey);
        if (!plan) {
          return res.status(200).json({ status: "ignored - unknown plan" });
        }

        const config = PLAN_CONFIG[planKey] || { plan: "starter", maxChildren: 1 };
        const isAnnual = plan.period === "yearly";
        const periodEnd = new Date();
        if (isAnnual) {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const currentUser = await storage.getUser(userId);
        if (currentUser && currentUser.plan !== "free" && currentUser.planExpiresAt && new Date(currentUser.planExpiresAt) > new Date()) {
          console.log(`[Webhook] User ${userId} already has active plan ${currentUser.plan}, skipping duplicate`);
          return res.status(200).json({ status: "already_upgraded" });
        }

        const paymentId: string = event?.payload?.payment?.entity?.id || orderId;
        await storage.updateRazorpayCustomerId(userId, paymentId);
        await storage.updateUserPlan(userId, config.plan, config.maxChildren, periodEnd);
        console.log(`[Webhook] Upgraded user ${userId} to plan ${config.plan} via webhook for order ${orderId}`);
      }

      return res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("[Webhook] Error handling Razorpay webhook:", err);
      return res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/razorpay/recover-payment", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to recover your payment" });
      }

      const { orderId } = req.body;
      if (!orderId || typeof orderId !== "string") {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const razorpay = getRazorpay();
      let order: any;
      try {
        order = await razorpay.orders.fetch(orderId.trim());
      } catch {
        return res.status(404).json({ message: "Order not found. Please check your Order ID." });
      }

      const orderUserId = parseInt((order.notes as any)?.userId || "0", 10);
      if (orderUserId !== req.user.id) {
        return res.status(403).json({ message: "This order does not belong to your account." });
      }

      if (order.status !== "paid") {
        return res.status(400).json({ message: `Order is not paid yet. Current status: ${order.status}` });
      }

      const planKey = (order.notes as any)?.planKey;
      const plan = RAZORPAY_PLANS.find((p) => p.planKey === planKey);
      if (!plan) {
        return res.status(400).json({ message: "Could not determine plan from this order." });
      }

      const config = PLAN_CONFIG[planKey] || { plan: "starter", maxChildren: 1 };
      const isAnnual = plan.period === "yearly";
      const periodEnd = new Date();
      if (isAnnual) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await storage.updateUserPlan(req.user.id, config.plan, config.maxChildren, periodEnd);
      const updatedUser = await storage.getUser(req.user.id);
      console.log(`[Recover] User ${req.user.id} recovered plan ${config.plan} for order ${orderId}`);
      return res.json({ success: true, plan: config.plan, user: updatedUser });
    } catch (err) {
      console.error("[Recover] Payment recovery error:", err);
      return res.status(500).json({ message: "Payment recovery failed. Please contact support." });
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

  return httpServer;
}
