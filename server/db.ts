import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { resolveDatabaseUrl } from "./databaseUrl";

const { Pool } = pg;

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  throw new Error(
    "Database URL missing. Set DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME (local PostgreSQL).",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, {
  schema,
  logger: process.env.DEBUG_SQL === "1",
});
