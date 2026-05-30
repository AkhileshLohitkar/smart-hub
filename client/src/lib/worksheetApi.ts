import { apiRequest } from "./queryClient";

export async function generateWorksheetFromPrompt(prompt: string, options?: { model?: string }) {
  const res = await apiRequest("POST", "/api/worksheet/generate", {
    prompt,
    ...(options?.model ? { model: options.model } : {}),
  });
  return (await res.json()) as { success: true; data: string };
}

