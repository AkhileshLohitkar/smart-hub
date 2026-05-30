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

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`[utf8-migrate] Missing ${name} in environment`);
  return v;
}

function parseUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 5432,
    user: decodeURIComponent(u.username || ""),
    password: decodeURIComponent(u.password || ""),
    database: u.pathname.replace(/^\//, "") || "postgres",
  };
}

async function withClient(conn, fn) {
  const client = new pg.Client(conn);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const { host, port, user, password, database } = parseUrl(databaseUrl);

  const targetDb = database;
  const adminConn = { host, port, user, password, database: "postgres" };

  console.log(`[utf8-migrate] Target database: ${targetDb}`);
  console.log(`[utf8-migrate] Admin connect: ${host}:${port} (db=postgres)`);

  await withClient(adminConn, async (client) => {
    const existsRes = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb],
    );
    if (existsRes.rowCount && existsRes.rowCount > 0) {
      console.log("[utf8-migrate] Database already exists, skipping create.");
      return;
    }

    // Try user-requested statement first (may fail on Windows locales).
    const stmtFull =
      `CREATE DATABASE "${targetDb}" ` +
      `WITH ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE template0;`;

    const stmtFallback =
      `CREATE DATABASE "${targetDb}" WITH ENCODING 'UTF8' TEMPLATE template0;`;

    try {
      await client.query(stmtFull);
      console.log("[utf8-migrate] Created UTF-8 database with C locale/template0.");
    } catch (err) {
      console.warn(
        "[utf8-migrate] Full locale create failed; retrying without LC_COLLATE/LC_CTYPE. Error:",
        err?.code || err?.message || err,
      );
      await client.query(stmtFallback);
      console.log("[utf8-migrate] Created UTF-8 database using template0.");
    }
  });

  await withClient({ host, port, user, password, database: targetDb }, async (client) => {
    const enc = await client.query("SHOW SERVER_ENCODING;");
    console.log("[utf8-migrate] SHOW SERVER_ENCODING =", enc.rows?.[0]?.server_encoding);
  });

  console.log("[utf8-migrate] Next steps:");
  console.log("  - Run: npm run db:push");
  console.log("  - Restart dev server");
  console.log("  - Optional data migration:");
  console.log("      pg_dump <old_db> > backup.sql");
  console.log("      psql <new_db> < backup.sql");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

