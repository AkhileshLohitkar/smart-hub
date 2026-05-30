import OpenAI from "openai";

/** Dev-only fallback so the server boots without a key; real calls will 401 until you set .env */
export const DEV_OPENAI_PLACEHOLDER = "sk-local-dev-placeholder";

function trimEnv(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

function resolveApiKey(): string {
  const key =
    trimEnv(process.env.AI_INTEGRATIONS_OPENAI_API_KEY) ||
    trimEnv(process.env.OPENAI_API_KEY) ||
    (process.env.NODE_ENV === "development" ? DEV_OPENAI_PLACEHOLDER : "");
  if (!key) {
    throw new Error(
      "Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY in .env (copy from .env.example).",
    );
  }
  if (key === DEV_OPENAI_PLACEHOLDER) {
    console.warn(
      "[OpenAI] No API key in .env — set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY for LLM features.",
    );
  }
  return key;
}

const baseURL = trimEnv(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);

/**
 * Single OpenAI client for worksheets, vision, Replit integrations (chat/audio/image).
 * Reads: AI_INTEGRATIONS_OPENAI_API_KEY, OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL
 */
export const openai = new OpenAI({
  apiKey: resolveApiKey(),
  ...(baseURL ? { baseURL } : {}),
});
