/**
 * Load .env from the project root (folder that contains package.json), not from process.cwd().
 * Otherwise OpenAI keys stay empty and the app falls back to sk-local-dev-placeholder → 401.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const projectRoot = process.cwd();

export { projectRoot };


const candidates = [
  path.join(projectRoot, ".env"),
  // If the repo is nested (e.g. Downloads/Smart-Edu-Hub/Smart-Edu-Hub), allow .env one level up
  path.join(projectRoot, "..", ".env"),
];

let loadedPath: string | null = null;
for (const envPath of candidates) {
  if (!existsSync(envPath)) continue;
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    loadedPath = envPath;
    break;
  }
}

if (!loadedPath) {
  dotenv.config();
}

if (process.env.NODE_ENV !== "production") {
  if (!loadedPath) {
    console.warn(
      `[env] No .env file found. Create one at:\n` +
        `    ${path.join(projectRoot, ".env")}\n` +
        `  Copy from .env.example, then set AI_INTEGRATIONS_OPENAI_API_KEY (and BASE_URL if you use Replit).`,
    );
  } else if (process.env.DEBUG_ENV_LOAD === "1") {
    console.log("[env] Loaded", loadedPath);
  }
}
