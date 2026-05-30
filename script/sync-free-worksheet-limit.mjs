/**
 * Syncs free plan payment rows to the current worksheet limit (20).
 * Safe to run multiple times — only updates stale free_2 rows below the limit.
 */
import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const FREE_PLAN_WORKSHEETS_INCLUDED = 20;

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

async function main() {
  await client.connect();
  const result = await client.query(
    `
    UPDATE payments
    SET worksheet_limit = $1
    WHERE plan_key = 'free_2'
      AND (status = 'free' OR amount = 0)
      AND (worksheet_limit IS NULL OR worksheet_limit < $1)
    RETURNING id
    `,
    [FREE_PLAN_WORKSHEETS_INCLUDED],
  );
  console.log(
    `Updated ${result.rowCount ?? 0} free plan payment row(s) to worksheet_limit=${FREE_PLAN_WORKSHEETS_INCLUDED}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => client.end());
