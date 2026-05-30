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

const schemasToDrop = ["Worksheet", "children", "session"];

const client = new pg.Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000,
});

await client.connect();
try {
  for (const s of schemasToDrop) {
    await client.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`);
    // eslint-disable-next-line no-console
    console.log("[db] Dropped schema if existed:", s);
  }
} finally {
  await client.end();
}

