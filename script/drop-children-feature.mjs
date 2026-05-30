/**
 * Removes legacy children feature from the database:
 * - Drops public.children table if it exists
 * - Drops users.max_children column if it exists
 * - Drops legacy "children" schema if it exists (old Replit layout)
 */
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

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://smart_edu:smart_edu_local@127.0.0.1:5432/smart_edu_hub";

const client = new pg.Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000,
});

const steps = [
  {
    label: "Drop legacy children schema",
    sql: `DROP SCHEMA IF EXISTS "children" CASCADE`,
  },
  {
    label: "Drop children table (public)",
    sql: `DROP TABLE IF EXISTS public.children CASCADE`,
  },
  {
    label: "Drop child_id from worksheets if present",
    sql: `ALTER TABLE IF EXISTS public.worksheets DROP COLUMN IF EXISTS child_id`,
  },
  {
    label: "Drop max_children from users",
    sql: `ALTER TABLE IF EXISTS public.users DROP COLUMN IF EXISTS max_children`,
  },
];

await client.connect();
try {
  for (const { label, sql } of steps) {
    await client.query(sql);
    console.log("[db]", label, "— ok");
  }
  console.log("[db] Children feature cleanup complete.");
} catch (err) {
  console.error("[db] Cleanup failed:", err);
  process.exitCode = 1;
} finally {
  await client.end();
}
