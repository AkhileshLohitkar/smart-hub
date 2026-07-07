import { getAnswerKeyPath } from "@shared/answerKeyUrl";
import { countAnswerKeyEntries, hasAnswerKeyInContent } from "@shared/answerKey";
import type { Worksheet } from "@shared/schema";

export function logAnswerKeySaved(
  worksheet: Pick<Worksheet, "id" | "serialNumber" | "worksheetType" | "content">,
  source: string,
): void {
  const hasKey = hasAnswerKeyInContent(worksheet.content, worksheet.worksheetType);
  const entryCount = countAnswerKeyEntries(worksheet.content, worksheet.worksheetType);
  const qrPath = getAnswerKeyPath(worksheet.id);

  console.log("[answer-key] saved", {
    source,
    worksheetId: worksheet.id,
    serialNumber: worksheet.serialNumber,
    worksheetType: worksheet.worksheetType,
    hasAnswerKey: hasKey,
    answerKeyEntryCount: entryCount,
    qrPath,
  });

  if (!hasKey) {
    console.warn(
      `[answer-key] WARNING: worksheet ${worksheet.id} (${source}) was saved without answer key content`,
    );
  }
}
