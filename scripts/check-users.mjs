import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://smart_edu:smart_edu_local@127.0.0.1:5432/smart_edu_hub",
});

const cols = await pool.query(
  `SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'users'
   ORDER BY ordinal_position`,
);
const cnt = await pool.query("SELECT COUNT(*)::int AS n FROM users");
console.log("Row count:", cnt.rows[0].n);
for (const r of cols.rows) console.log(r.column_name, r.data_type, r.is_nullable);
await pool.end();
