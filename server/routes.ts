import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.worksheets.generate.path, async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in to generate worksheets" });
      }

      const input = api.worksheets.generate.input.parse(req.body);
      const userId = req.user.id;

      const user = await storage.getUser(userId);
      if (user && user.plan === "free" && user.worksheetsGenerated >= 5) {
        return res.status(403).json({ message: "Free plan limit reached. Please upgrade to continue generating worksheets." });
      }

      const prompt = `Generate a printable educational worksheet with the following requirements:
Class/Standard: ${input.className}
Education Board: ${input.board}
Subject: ${input.subject}
Chapter: ${input.chapter || "Not specified"}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Approximate Number of questions: ${input.length}

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
7. Generate a COMPLETE answerKey for ALL questions in ALL sections. The answer field should contain the correct answer text.
8. Make the worksheet compact and well-organized to fit maximum content on A4 paper.
9. Ensure questions are strictly aligned with the specified board syllabus and appropriate for the class level.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert educator who designs high-quality, syllabus-aligned worksheets. Always include a complete answer key." },
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

  return httpServer;
}
