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

      if (userId) {
        const user = await storage.getUser(userId);
        if (user && user.plan === "free" && user.worksheetsGenerated >= 5) {
          return res.status(403).json({ message: "Free plan limit reached. Please upgrade to continue generating worksheets." });
        }
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
          "answerSpaceLines": 2
        }
      ]
    }
  ]
}

IMPORTANT: Include 2-3 colorful, minimalist, education-themed graphic descriptions in the "graphics" array that are directly relevant to the topic (e.g., if topic is "Plants", suggest "a colorful green leaf" or "a smiling sun"). These will be rendered as icons or simple illustrations.
Ensure the questions are strictly aligned with the specified board syllabus and appropriate for the class level.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert educator who designs high-quality, syllabus-aligned worksheets." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const content = JSON.parse(response.choices[0]?.message?.content || "{}");

      const worksheet = await storage.createWorksheet(input, content, userId);

      if (userId) {
        await storage.incrementWorksheetCount(userId);
      }

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

  return httpServer;
}
