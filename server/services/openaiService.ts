import { openai } from "../openaiClient";

function resolveModel(modelOverride?: string): string {
  const fromEnv = process.env.OPENAI_MODEL?.trim();
  if (modelOverride?.trim()) return modelOverride.trim();
  if (fromEnv) return fromEnv;
  return "gpt-5.1";
}

export async function generateWorksheet(prompt: string, options?: { model?: string }) {
  const cleanPrompt = prompt?.trim();
  if (!cleanPrompt) {
    throw new Error("Prompt is required");
  }

  const response = await openai.responses.create({
    model: resolveModel(options?.model),
    input: cleanPrompt,
  });

  return response.output_text;
}

