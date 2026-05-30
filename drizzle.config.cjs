/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const fs = require("fs");
const { defineConfig } = require("drizzle-kit");

const root = __dirname;

function loadEnvFiles() {
  for (const envPath of [
    path.join(root, ".env"),
    path.join(root, "..", ".env"),
  ]) {
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = val;
      }
    }
    break;
  }
}

function resolveDatabaseUrl() {
  const explicit = process.env.DATABASE_URL?.trim();
  if (explicit) return explicit;
  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "5432";
  const user = process.env.DB_USER ?? "postgres";
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME ?? "smart_edu_hub";
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(password);
  const auth = password === "" ? `${u}@` : `${u}:${p}@`;
  return `postgresql://${auth}${host}:${port}/${database}`;
}

loadEnvFiles();

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  throw new Error(
    "Database URL missing. Set DATABASE_URL or DB_* variables for local PostgreSQL.",
  );
}

module.exports = defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
