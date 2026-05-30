import { config as loadDotenv } from "dotenv";
import pg from "pg";

loadDotenv();

const { Client } = pg;

const sql = `
CREATE TABLE IF NOT EXISTS brainflex_worksheets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  class_name TEXT NOT NULL,
  board TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL,
  puzzle_types JSONB NOT NULL,
  generated_content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
`;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log("brainflex_worksheets table ensured");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed to ensure brainflex table:", err);
  process.exit(1);
});
