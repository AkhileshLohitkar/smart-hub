/**
 * Import users from users_migrated.csv into PostgreSQL.
 *
 * Usage:
 *   node script/import-users-migrated.mjs
 *   node script/import-users-migrated.mjs --file path/to/users.csv
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

const VALID_ROLES = new Set(["Student", "Parent", "Teacher", "Professional"]);

const args = process.argv.slice(2);
const fileArgIdx = args.indexOf("--file");
const csvPath = resolve(
  fileArgIdx >= 0 ? args[fileArgIdx + 1] : join(root, "users_migrated.csv"),
);

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
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseTimestamp(v) {
  const s = cleanValue(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function inferPlanName(plan) {
  const p = (plan || "free").toLowerCase();
  if (p === "free") return "Free";
  if (p.includes("starter")) return "Starter";
  if (p.includes("family")) return "Growth";
  if (p === "no_watermark") return "Starter Pro";
  if (p === "paid") return "Starter";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function resolveRole(row) {
  const explicit = cleanValue(row.role);
  if (explicit && VALID_ROLES.has(explicit)) return explicit;

  const category = cleanValue(row.user_category);
  if (category && VALID_ROLES.has(category)) return category;

  return null;
}

function mapRow(row) {
  const email = cleanValue(row.email);
  if (!email) return null;

  const plan = cleanValue(row.plan) || "free";
  const planType = cleanValue(row.plan_type) || "worksheet";
  const planName = cleanValue(row.plan_name) || inferPlanName(plan);

  return {
    id: parseIntOrNull(row.id),
    email,
    password: cleanValue(row.password) || "",
    name: cleanValue(row.name) || "Unknown",
    mobile_number: cleanValue(row.mobile_number) || "",
    role: resolveRole(row),
    user_category: cleanValue(row.user_category),
    google_id: cleanValue(row.google_id),
    facebook_id: cleanValue(row.facebook_id),
    plan,
    plan_type: planType,
    plan_name: planName,
    billing_cycle: cleanValue(row.billing_cycle),
    student_count: parseIntOrNull(row.student_count, null),
    plan_expires_at: parseTimestamp(row.plan_expires_at),
    worksheets_generated: parseIntOrNull(row.worksheets_generated, 0),
    top_up_worksheets_balance: parseIntOrNull(row.top_up_worksheets, 0),
    stripe_customer_id: cleanValue(row.stripe_customer_id),
    stripe_subscription_id: cleanValue(row.stripe_subscription_id),
    razorpay_customer_id: cleanValue(row.razorpay_customer_id),
    razorpay_subscription_id: cleanValue(row.razorpay_subscription_id),
    last_login_at: parseTimestamp(row.last_login_at),
    last_logout_at: parseTimestamp(row.last_logout_at),
    created_at: parseTimestamp(row.created_at),
  };
}

const UPSERT_SQL = `
INSERT INTO users (
  id, email, password, name, mobile_number, role, user_category,
  google_id, facebook_id, plan, plan_type, plan_name, billing_cycle,
  student_count, plan_expires_at, worksheets_generated, top_up_worksheets_balance,
  stripe_customer_id, stripe_subscription_id, razorpay_customer_id, razorpay_subscription_id,
  last_login_at, last_logout_at, created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7,
  $8, $9, $10, $11, $12, $13,
  $14, $15, $16, $17,
  $18, $19, $20, $21,
  $22, $23, $24
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  mobile_number = EXCLUDED.mobile_number,
  role = EXCLUDED.role,
  user_category = EXCLUDED.user_category,
  google_id = EXCLUDED.google_id,
  facebook_id = EXCLUDED.facebook_id,
  plan = EXCLUDED.plan,
  plan_type = EXCLUDED.plan_type,
  plan_name = EXCLUDED.plan_name,
  billing_cycle = EXCLUDED.billing_cycle,
  student_count = EXCLUDED.student_count,
  plan_expires_at = EXCLUDED.plan_expires_at,
  worksheets_generated = EXCLUDED.worksheets_generated,
  top_up_worksheets_balance = EXCLUDED.top_up_worksheets_balance,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  razorpay_customer_id = EXCLUDED.razorpay_customer_id,
  razorpay_subscription_id = EXCLUDED.razorpay_subscription_id,
  last_login_at = EXCLUDED.last_login_at,
  last_logout_at = EXCLUDED.last_logout_at,
  created_at = COALESCE(EXCLUDED.created_at, users.created_at)
`;

const INSERT_NO_ID_SQL = `
INSERT INTO users (
  email, password, name, mobile_number, role, user_category,
  google_id, facebook_id, plan, plan_type, plan_name, billing_cycle,
  student_count, plan_expires_at, worksheets_generated, top_up_worksheets_balance,
  stripe_customer_id, stripe_subscription_id, razorpay_customer_id, razorpay_subscription_id,
  last_login_at, last_logout_at, created_at
) VALUES (
  $1, $2, $3, $4, $5, $6,
  $7, $8, $9, $10, $11, $12,
  $13, $14, $15, $16,
  $17, $18, $19, $20,
  $21, $22, $23
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  mobile_number = EXCLUDED.mobile_number,
  role = EXCLUDED.role,
  user_category = EXCLUDED.user_category,
  google_id = EXCLUDED.google_id,
  facebook_id = EXCLUDED.facebook_id,
  plan = EXCLUDED.plan,
  plan_type = EXCLUDED.plan_type,
  plan_name = EXCLUDED.plan_name,
  billing_cycle = EXCLUDED.billing_cycle,
  student_count = EXCLUDED.student_count,
  plan_expires_at = EXCLUDED.plan_expires_at,
  worksheets_generated = EXCLUDED.worksheets_generated,
  top_up_worksheets_balance = EXCLUDED.top_up_worksheets_balance,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  razorpay_customer_id = EXCLUDED.razorpay_customer_id,
  razorpay_subscription_id = EXCLUDED.razorpay_subscription_id,
  last_login_at = EXCLUDED.last_login_at,
  last_logout_at = EXCLUDED.last_logout_at,
  created_at = COALESCE(EXCLUDED.created_at, users.created_at)
`;

async function main() {
  if (!existsSync(csvPath)) {
    console.error("[import-users] CSV not found:", csvPath);
    process.exit(1);
  }

  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://smart_edu:smart_edu_local@127.0.0.1:5432/smart_edu_hub";

  const text = readFileSync(csvPath, "utf8");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });

  const byEmail = new Map();
  for (const raw of records) {
    const mapped = mapRow(raw);
    if (!mapped) continue;
    byEmail.set(mapped.email.toLowerCase(), mapped);
  }

  const rows = [...byEmail.values()];
  console.log("[import-users] CSV:", csvPath);
  console.log("[import-users] Rows in file:", records.length);
  console.log("[import-users] Unique emails to import:", rows.length);

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const before = await client.query("SELECT COUNT(*)::int AS n FROM users");
    console.log("[import-users] Users before:", before.rows[0].n);

    await client.query("BEGIN");

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      const existing = await client.query(
        "SELECT id FROM users WHERE lower(email) = lower($1)",
        [row.email],
      );

      const rowValues = [
        row.email,
        row.password,
        row.name,
        row.mobile_number,
        row.role,
        row.user_category,
        row.google_id,
        row.facebook_id,
        row.plan,
        row.plan_type,
        row.plan_name,
        row.billing_cycle,
        row.student_count,
        row.plan_expires_at,
        row.worksheets_generated,
        row.top_up_worksheets_balance,
        row.stripe_customer_id,
        row.stripe_subscription_id,
        row.razorpay_customer_id,
        row.razorpay_subscription_id,
        row.last_login_at,
        row.last_logout_at,
        row.created_at,
      ];

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE users SET
            password = $2, name = $3, mobile_number = $4, role = $5, user_category = $6,
            google_id = $7, facebook_id = $8, plan = $9, plan_type = $10, plan_name = $11,
            billing_cycle = $12, student_count = $13, plan_expires_at = $14,
            worksheets_generated = $15, top_up_worksheets_balance = $16,
            stripe_customer_id = $17, stripe_subscription_id = $18,
            razorpay_customer_id = $19, razorpay_subscription_id = $20,
            last_login_at = $21, last_logout_at = $22,
            created_at = COALESCE($23, created_at)
          WHERE lower(email) = lower($1)`,
          rowValues,
        );
        updated++;
      } else {
        let idConflict = false;
        if (row.id != null) {
          const idCheck = await client.query("SELECT id FROM users WHERE id = $1", [row.id]);
          idConflict = idCheck.rows.length > 0;
        }

        if (row.id != null && !idConflict) {
          await client.query(UPSERT_SQL, [row.id, ...rowValues]);
        } else {
          if (idConflict) {
            console.warn(
              "[import-users] ID",
              row.id,
              "already taken — inserting",
              row.email,
              "with a new auto id",
            );
          }
          await client.query(INSERT_NO_ID_SQL, rowValues);
        }
        inserted++;
      }
    }

    await client.query(
      "SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users), 1))",
    );

    await client.query("COMMIT");

    const after = await client.query("SELECT COUNT(*)::int AS n FROM users");
    const withRole = await client.query(
      "SELECT COUNT(*)::int AS n FROM users WHERE role IS NOT NULL",
    );

    console.log("[import-users] Inserted:", inserted);
    console.log("[import-users] Updated:", updated);
    console.log("[import-users] Users after:", after.rows[0].n);
    console.log("[import-users] Users with role set:", withRole.rows[0].n);
    console.log("[import-users] Done.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[import-users] FAILED:", err.message);
  if (err.detail) console.error(err.detail);
  process.exit(1);
});
