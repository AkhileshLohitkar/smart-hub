import { buildAnswerKeyApiPath } from "@shared/answerKey";
import type { Worksheet } from "@shared/schema";

export type AnswerKeyResponse = Worksheet;

export async function fetchAnswerKey(worksheetId: number): Promise<AnswerKeyResponse> {
  const apiUrl = buildAnswerKeyApiPath(worksheetId);
  console.log("[answer-key] fetch", { worksheetId, apiUrl });

  const res = await fetch(apiUrl);
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.message || "Answer key not found");
    }
    throw new Error(
      res.status === 404
        ? "Answer key API is unavailable. Restart the dev server and try again."
        : "Answer key not found",
    );
  }
  return res.json();
}
