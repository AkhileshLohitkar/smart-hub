import pg from "pg";
import fs from "fs";
import { parse } from "csv-parse/sync";

const pool = new pg.Pool({
  connectionString: "postgresql://smart_edu:smart_edu_local@127.0.0.1:5432/smart_edu_hub",
});

const csvPath = "C:/Users/HP/Downloads/migration_output/users_transformed.csv";

async function main() {
  const cols = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'
     ORDER BY ordinal_position`,
  );
  const cnt = await pool.query("SELECT COUNT(*)::int AS n FROM users");
  console.log("Current row count:", cnt.rows[0].n);
  console.log("DB columns:", cols.rows.map((r) => r.column_name).join(", "));

  const dbCols = cols.rows.map((r) => r.column_name);
  const text = fs.readFileSync(csvPath, "utf8");
  const records = parse(text, { columns: true, skip_empty_lines: true, relax_quotes: true });
  const csvCols = Object.keys(records[0] || {});

  const missingInDb = csvCols.filter((c) => !dbCols.includes(c));
  const missingInCsv = dbCols.filter((c) => !csvCols.includes(c) && c !== "id");

  if (missingInDb.length) {
    console.error("CSV columns not in DB:", missingInDb.join(", "));
    process.exit(1);
  }

  const useCols = dbCols.filter((c) => csvCols.includes(c));
  console.log("Importing columns:", useCols.join(", "));
  console.log("Rows to import:", records.length);

  if (cnt.rows[0].n > 0) {
    console.log("Table already has rows — skipping import to avoid duplicates.");
    console.log("Delete existing rows first if you want a fresh import.");
    await pool.end();
    return;
  }

  const placeholders = useCols.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `INSERT INTO users (${useCols.join(", ")}) VALUES (${placeholders})`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of records) {
      const values = useCols.map((col) => {
        const v = row[col];
        if (v === "" || v === undefined) return null;
        if (["id", "student_count", "worksheets_generated"].includes(col)) return parseInt(v, 10);
        return v;
      });
      await client.query(sql, values);
    }
    await client.query("SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users), 1))");
    await client.query("COMMIT");
    const after = await pool.query("SELECT COUNT(*)::int AS n FROM users");
    console.log("Import complete. Row count:", after.rows[0].n);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Import failed:", e.message);
  process.exit(1);
});
