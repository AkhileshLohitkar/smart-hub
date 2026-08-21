import { storage } from "../storage";
import { generateWorksheetContent } from "./worksheetGenerator";
import { resolveWhatsAppUser } from "./whatsappUser";
import { generateWhatsAppWorksheetPdf } from "./whatsappWorksheetPdf";
import type { UserRole } from "@shared/schema";
import fs from "node:fs/promises";
import path from "node:path";

export type WhatsAppWorksheetInput = {
  mobile: string;
  role: UserRole;
  board: string;
  className: string;
  subject: string;
  topic: string;
};

export async function generateWhatsAppWorksheet(
  input: WhatsAppWorksheetInput,
) {
  const user = await resolveWhatsAppUser(input.mobile, input.role);

  const content = await generateWorksheetContent({
    className: input.className,
    board: input.board,
    subject: input.subject,
    topic: input.topic,
    difficulty: "medium",
    length: 10,
  });

  const worksheet = await storage.createWorksheet(
    {
      board: input.board,
      className: input.className,
      subject: input.subject,
      topic: input.topic,
      difficulty: "medium",
      length: 10,
      colorMode: "bw",
      worksheetType: "worksheet",
    },
    content,
    user.id,
  );

  // Generate PDF
  const pdfBuffer = await generateWhatsAppWorksheetPdf(worksheet);

  // Save PDF on server
  const pdfDir = path.join(process.cwd(), "generated-pdfs");

  await fs.mkdir(pdfDir, { recursive: true });

  const safeSubject = input.subject.replace(/[^a-zA-Z0-9-_]/g, "_");
  const safeTopic = input.topic.replace(/[^a-zA-Z0-9-_]/g, "_");

  const fileName =
    `QikWorksheet_${safeSubject}_${safeTopic}_${worksheet.id}.pdf`;

  const filePath = path.join(pdfDir, fileName);

  await fs.writeFile(filePath, pdfBuffer);

  console.log(
    `[WhatsApp Worksheet] PDF saved: ${filePath}`,
  );

  return {
    user,
    worksheet,
    pdfBuffer,
    pdfFileName: fileName,
  };
}