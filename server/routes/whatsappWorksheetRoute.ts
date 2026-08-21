import type { Express } from "express";
import { z } from "zod";
import {
  generateWhatsAppWorksheet,
} from "../services/whatsappWorksheet";
import type { UserRole } from "@shared/schema";

const whatsappWorksheetSchema = z.object({
  mobile: z.string().min(10),
  role: z.enum(["Parent", "Teacher"]),
  board: z.string().min(1),
  className: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
});

export function registerWhatsAppWorksheetRoute(app: Express) {
  app.post("/api/v1/generate-worksheet", async (req, res) => {
    try {
      const parsed = whatsappWorksheetSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid worksheet request",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const input = {
        ...parsed.data,
        role: parsed.data.role as UserRole,
      };

      const result = await generateWhatsAppWorksheet(input);

      const baseUrl =
        process.env.PUBLIC_BASE_URL ||
        `${req.protocol}://${req.get("host")}`;

      const pdfUrl =
        `${baseUrl}/generated-pdfs/${encodeURIComponent(result.pdfFileName)}`;

        return res.status(200).json({
        success: true,
        worksheetId: result.worksheet.id,
        serialNumber: result.worksheet.serialNumber,
        pdfUrl,
        fileName: result.pdfFileName,
        }); 
    } catch (error) {
      console.error("[WhatsApp Worksheet] Generation failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate WhatsApp worksheet";

      return res.status(500).json({
        success: false,
        message,
      });
    }
  });
}

