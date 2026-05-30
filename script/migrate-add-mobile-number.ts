import { pool } from "../server/db";

async function main() {
  // Keep existing rows valid: add column with default '' and NOT NULL.
  await pool.query(`
    ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "mobile_number" text NOT NULL DEFAULT '';
  `);
}

main()
  .then(() => {
    console.log("OK: ensured users.mobile_number column exists");
    process.exit(0);
  })
  .catch((err) => {
    console.error("ERROR: could not add users.mobile_number:", err);
    process.exit(1);
  })
  .finally(() => {
    void pool.end();
  });

