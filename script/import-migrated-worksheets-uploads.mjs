/**
 * Import worksheets_migrated.csv and content_uploads_migrated.csv.
 *
 * Usage:
 *   node script/import-migrated-worksheets-uploads.mjs
 *   node script/import-migrated-worksheets-uploads.mjs --worksheets-only
 *   node script/import-migrated-worksheets-uploads.mjs --uploads-only
 */
import { config as loadDotenv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { parse } from "csv-parse/sync";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envHere = join(root, ".env");
if (existsSync(envHere)) loadDotenv({ path: envHere });
else loadDotenv();

const args = new Set(process.argv.slice(2));
const worksheetsOnly = args.has("--worksheets-only");
const uploadsOnly = args.has("--uploads-only");
const runWorksheets = !uploadsOnly;
const runUploads = !worksheetsOnly;

const worksheetsPath = join(root, "worksheets_migrated.csv");
const uploadsPath = join(root, "content_uploads_migrated.csv");
const usersPath = join(root, "users_migrated.csv");

function cleanValue(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  while (s.startsWith('"""') && s.endsWith('"""')) {
    s = s.slice(3, -3).trim();
  }
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).trim();
  }
  return s === "" ? null : s;
}

function parseIntOrNull(v, fallback = null) {
  const s = cleanValue(v);
  if (s == null) return fallback;
  const n = parseInt(String(s).replace(/\.0+$/, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseTimestamp(v) {
  const s = cleanValue(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseJsonField(raw) {
  const s = cleanValue(raw);
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    try {
      return JSON.parse(s.replace(/""/g, '"'));
    } catch {
      return { _importRaw: s };
    }
  }
}

function readCsv(path) {
  return parse(readFileSync(path, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });
}

async function buildCsvUserIdToDbId(client) {
  if (!existsSync(usersPath)) {
    console.warn("[import] users_migrated.csv not found — using raw user_id values");
    return new Map();
  }

  const usersCsv = readCsv(usersPath);
  const csvIdToEmail = new Map();
  for (const row of usersCsv) {
    const csvId = parseIntOrNull(row.id);
    const email = cleanValue(row.email)?.toLowerCase();
    if (csvId != null && email) csvIdToEmail.set(csvId, email);
  }

  const dbRes = await client.query("SELECT id, lower(email) AS email FROM users");
  const emailToDbId = new Map(dbRes.rows.map((r) => [r.email, r.id]));

  const map = new Map();
  for (const [csvId, email] of csvIdToEmail) {
    const dbId = emailToDbId.get(email);
    if (dbId != null) map.set(csvId, dbId);
  }
  console.log("[import] User id map entries:", map.size);
  return map;
}

function resolveDbUserId(csvUserId, userIdMap) {
  const csvId = parseIntOrNull(csvUserId);
  if (csvId == null) return null;
  if (userIdMap.size === 0) return csvId;
  return userIdMap.get(csvId) ?? null;
}

async function idTaken(client, table, id) {
  const r = await client.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
  return r.rows.length > 0;
}

async function importWorksheets(client, userIdMap) {
  if (!existsSync(worksheetsPath)) {
    console.error("[import] Missing:", worksheetsPath);
    return;
  }

  const records = readCsv(worksheetsPath);
  console.log("[import] Worksheets in CSV:", records.length);

  const before = await client.query("SELECT COUNT(*)::int AS n FROM worksheets");
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const INSERT_SQL = `
    INSERT INTO worksheets (
      id, serial_number, user_id, class_name, board, subject, chapter, topic,
      difficulty, length, color_mode, worksheet_type, content, rating, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13::json, $14, $15
    )
    ON CONFLICT (id) DO UPDATE SET
      serial_number = EXCLUDED.serial_number,
      user_id = EXCLUDED.user_id,
      class_name = EXCLUDED.class_name,
      board = EXCLUDED.board,
      subject = EXCLUDED.subject,
      chapter = EXCLUDED.chapter,
      topic = EXCLUDED.topic,
      difficulty = EXCLUDED.difficulty,
      length = EXCLUDED.length,
      color_mode = EXCLUDED.color_mode,
      worksheet_type = EXCLUDED.worksheet_type,
      content = EXCLUDED.content,
      rating = EXCLUDED.rating,
      created_at = COALESCE(EXCLUDED.created_at, worksheets.created_at)
  `;

  const INSERT_NO_ID_SQL = `
    INSERT INTO worksheets (
      serial_number, user_id, class_name, board, subject, chapter, topic,
      difficulty, length, color_mode, worksheet_type, content, rating, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12::json, $13, $14
    )
  `;

  for (const row of records) {
    const csvId = parseIntOrNull(row.id);
    const userId = resolveDbUserId(row.user_id, userIdMap);
    const topic = cleanValue(row.topic) || cleanValue(row.chapter) || "General";
    const content = parseJsonField(row.content);
    const values = [
      cleanValue(row.serial_number),
      userId,
      cleanValue(row.class_name) || "Unknown",
      cleanValue(row.board) || "CBSE",
      cleanValue(row.subject) || "General",
      cleanValue(row.chapter),
      topic,
      cleanValue(row.difficulty) || "medium",
      parseIntOrNull(row.length, 10),
      cleanValue(row.color_mode) || "bw",
      cleanValue(row.worksheet_type) || "worksheet",
      JSON.stringify(content),
      parseIntOrNull(row.rating),
      parseTimestamp(row.created_at),
    ];

    if (csvId == null) {
      skipped++;
      continue;
    }

    const exists = await client.query("SELECT id FROM worksheets WHERE id = $1", [csvId]);
    if (exists.rows.length > 0) {
      await client.query(INSERT_SQL, [csvId, ...values]);
      updated++;
    } else {
      const taken = await idTaken(client, "worksheets", csvId);
      if (taken) {
        await client.query(INSERT_NO_ID_SQL, values);
        inserted++;
      } else {
        await client.query(INSERT_SQL, [csvId, ...values]);
        inserted++;
      }
    }
  }

  await client.query(
    "SELECT setval(pg_get_serial_sequence('worksheets','id'), COALESCE((SELECT MAX(id) FROM worksheets), 1))",
  );

  const after = await client.query("SELECT COUNT(*)::int AS n FROM worksheets");
  console.log("[import] Worksheets inserted:", inserted);
  console.log("[import] Worksheets updated:", updated);
  console.log("[import] Worksheets skipped (no id):", skipped);
  console.log("[import] Worksheets before/after:", before.rows[0].n, "→", after.rows[0].n);
}

async function importContentUploads(client, userIdMap) {
  if (!existsSync(uploadsPath)) {
    console.error("[import] Missing:", uploadsPath);
    return;
  }

  const records = readCsv(uploadsPath);
  console.log("[import] Content uploads in CSV:", records.length);

  const before = await client.query("SELECT COUNT(*)::int AS n FROM content_uploads");
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const UPSERT_SQL = `
    INSERT INTO content_uploads (
      id, user_id, board, class_name, subject, chapter, topic,
      extracted_text, source_description, page_count, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11
    )
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      board = EXCLUDED.board,
      class_name = EXCLUDED.class_name,
      subject = EXCLUDED.subject,
      chapter = EXCLUDED.chapter,
      topic = EXCLUDED.topic,
      extracted_text = EXCLUDED.extracted_text,
      source_description = EXCLUDED.source_description,
      page_count = EXCLUDED.page_count,
      created_at = COALESCE(EXCLUDED.created_at, content_uploads.created_at)
  `;

  const INSERT_NO_ID_SQL = `
    INSERT INTO content_uploads (
      user_id, board, class_name, subject, chapter, topic,
      extracted_text, source_description, page_count, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10
    )
  `;

  for (const row of records) {
    const csvId = parseIntOrNull(row.id);
    const userId = resolveDbUserId(row.user_id, userIdMap);
    if (userId == null) {
      console.warn("[import] Skip content_upload id", csvId, "— user_id", row.user_id, "not mapped");
      skipped++;
      continue;
    }

    const extractedText = cleanValue(row.extracted_text) || "";
    const values = [
      userId,
      cleanValue(row.board) || "CBSE",
      cleanValue(row.class_name) || "Unknown",
      cleanValue(row.subject) || "General",
      cleanValue(row.chapter) || "",
      cleanValue(row.topic) || "",
      extractedText,
      cleanValue(row.source_description) || "",
      parseIntOrNull(row.page_count, 1),
      parseTimestamp(row.created_at),
    ];

    if (csvId == null) {
      await client.query(INSERT_NO_ID_SQL, values);
      inserted++;
      continue;
    }

    const exists = await client.query("SELECT id FROM content_uploads WHERE id = $1", [csvId]);
    if (exists.rows.length > 0) {
      await client.query(UPSERT_SQL, [csvId, ...values]);
      updated++;
    } else {
      const taken = await idTaken(client, "content_uploads", csvId);
      if (taken) {
        await client.query(INSERT_NO_ID_SQL, values);
        inserted++;
      } else {
        await client.query(UPSERT_SQL, [csvId, ...values]);
        inserted++;
      }
    }
  }

  await client.query(
    "SELECT setval(pg_get_serial_sequence('content_uploads','id'), COALESCE((SELECT MAX(id) FROM content_uploads), 1))",
  );

  const after = await client.query("SELECT COUNT(*)::int AS n FROM content_uploads");
  console.log("[import] Content uploads inserted:", inserted);
  console.log("[import] Content uploads updated:", updated);
  console.log("[import] Content uploads skipped:", skipped);
  console.log("[import] Content uploads before/after:", before.rows[0].n, "→", after.rows[0].n);
}

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://smart_edu:smart_edu_local@127.0.0.1:5432/smart_edu_hub";

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const userIdMap = await buildCsvUserIdToDbId(client);
    await client.query("BEGIN");

    if (runWorksheets) await importWorksheets(client, userIdMap);
    if (runUploads) await importContentUploads(client, userIdMap);

    await client.query("COMMIT");
    console.log("[import] Done.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[import] FAILED:", err.message);
  if (err.detail) console.error(err.detail);
  process.exit(1);
});
