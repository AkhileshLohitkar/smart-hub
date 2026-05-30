import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envHere = join(root, ".env");
const envParent = join(root, "..", ".env");
if (existsSync(envHere)) loadDotenv({ path: envHere });
else if (existsSync(envParent)) loadDotenv({ path: envParent });
else loadDotenv();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`[migrate-user-activity] Missing ${name} in environment`);
  return v;
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;
    `);
    await client.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "last_logout_at" timestamp;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_activity_logs" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "action_type" text NOT NULL,
        "worksheet_id" integer REFERENCES "worksheets"("id") ON DELETE SET NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "user_activity_logs_user_id_idx"
        ON "user_activity_logs" ("user_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "user_activity_logs_created_at_idx"
        ON "user_activity_logs" ("created_at");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "user_activity_logs_user_id_created_at_idx"
        ON "user_activity_logs" ("user_id", "created_at");
    `);

    await client.query("COMMIT");
    console.log("[migrate-user-activity] OK");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-user-activity] FAILED:", e?.code || e?.message || e);
  process.exit(1);
});

