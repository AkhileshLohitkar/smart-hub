import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envHere = join(root, ".env");
const envParent = join(root, "..", ".env");
if (existsSync(envHere)) loadDotenv({ path: envHere });
else if (existsSync(envParent)) loadDotenv({ path: envParent });
else loadDotenv();
const portFromDatabaseUrl = (() => {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const p = u.port ? parseInt(u.port, 10) : 5432;
    return Number.isFinite(p) && p >= 1 ? p : null;
  } catch {
    return null;
  }
})();

const dbNameFromDatabaseUrl = (() => {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const name = u.pathname?.replace(/^\//, "").trim();
    return name ? name : null;
  } catch {
    return null;
  }
})();

const port = portFromDatabaseUrl ?? parseInt(process.env.PGPORT || process.env.DB_PORT || "5432", 10);
if (!Number.isFinite(port) || port < 1) {
  console.error("[local-db] Invalid PGPORT / DB_PORT");
  process.exit(1);
}

const dataDir = join(root, ".embedded-pg");
const dbName = dbNameFromDatabaseUrl ?? process.env.DB_NAME ?? "smart_edu_hub";
const databaseUrl = `postgresql://smart_edu:smart_edu_local@127.0.0.1:${port}/${dbName}`;
const urlPostgresDb = `postgresql://smart_edu:smart_edu_local@127.0.0.1:${port}/postgres`;

const childEnv = {
  ...process.env,
  NODE_ENV: "development",
  DATABASE_URL: databaseUrl,
  PORT: process.env.PORT || "5000",
};

async function tryConnect(url) {
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    await client.end();
    return "ok";
  } catch (err) {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return err;
  }
}

async function ensureDatabaseExists() {
  const err = await tryConnect(databaseUrl);
  if (err === "ok") return;

  const code = err && err.code;
  if (code !== "3D000") {
    throw new Error(
      `[local-db] Expected database ${dbName} or permission to create it. ` +
        `Got: ${code || err.message || err}\n` +
        `Check DATABASE_URL user/password and port ${port}.`,
    );
  }

  const client = new pg.Client({
    connectionString: urlPostgresDb,
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log("[local-db] Created database", dbName);
  } finally {
    await client.end();
  }
}

async function reuseExistingPostgres() {
  console.log(
    "[local-db] Port",
    port,
    "already has PostgreSQL; reusing it (same user/password as .env).",
  );
  await ensureDatabaseExists();
}

async function startEmbeddedWithDiagnostics() {
  const pgLogs = [];
  const instance = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "smart_edu",
    password: "smart_edu_local",
    port,
    persistent: true,
    onLog: (m) => {
      pgLogs.push(m);
    },
    onError: console.error,
  });

  console.log("[local-db] Starting embedded PostgreSQL on port", port, "…");

  try {
    await access(join(dataDir, "PG_VERSION"));
  } catch {
    await instance.initialise();
  }

  await instance.start().catch(() => {
    const tail = pgLogs.join("").trimEnd();
    const msg = new Error(
      `Embedded PostgreSQL exited before becoming ready (port ${port}).\n\n` +
        (tail ? `${tail}\n\n` : "") +
        `Common fixes:\n` +
        `  • Port ${port} is in use — stop Docker Postgres / Windows PostgreSQL, or run:\n` +
        `      $env:PGPORT="5433"\n` +
        `    and set DATABASE_URL to use that port (then npm run dev:local).\n` +
        `  • Corrupt data — delete folder: ${dataDir}\n` +
        `    then run npm run dev:local again.`,
    );
    throw msg;
  });

  const admin = instance.getPgClient();
  await admin.connect();
  try {
    const { rows } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (rows.length === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log("[local-db] Created database", dbName);
    }
  } finally {
    await admin.end();
  }

  return instance;
}

/** @type {EmbeddedPostgres | null} */
let embedded = null;

const refused = await tryConnect(databaseUrl);
const errObj = refused !== "ok" ? refused : null;
const code = errObj && errObj.code;

if (refused === "ok") {
  console.log("[local-db] PostgreSQL already reachable at", databaseUrl.split("@")[1]);
} else if (code === "ECONNREFUSED" || code === "ETIMEDOUT") {
  embedded = await startEmbeddedWithDiagnostics();
} else if (code === "3D000") {
  const r = await tryConnect(urlPostgresDb);
  if (r === "ok") {
    await reuseExistingPostgres();
  } else if (r !== "ok" && r.code === "ECONNREFUSED") {
    embedded = await startEmbeddedWithDiagnostics();
  } else {
    console.error(
      `[local-db] Database ${dbName} is missing and could not connect as postgres super-db:`,
      r !== "ok" ? r.code || r.message : r,
    );
    process.exit(1);
  }
} else if (code === "28P01" || code === "28000") {
  console.error(
    `[local-db] PostgreSQL on port ${port} rejected user smart_edu (wrong password or auth).`,
    `\nStop the other server or fix credentials in script/run-local.mjs and .env.`,
  );
  process.exit(1);
} else {
  console.error("[local-db] Unexpected error connecting to PostgreSQL:", errObj);
  process.exit(1);
}

if (refused === "ok") {
  await ensureDatabaseExists();
}

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: { ...childEnv, DATABASE_URL: databaseUrl },
    });
    child.on("close", (c) =>
      c === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(" ")} exited with code ${c}`)),
    );
  });

console.log("[local-db] Applying schema (drizzle-kit push)…");
await run("npm", ["run", "db:push", "--", "--force"]);

console.log(
  "[local-db] Default URL: http://localhost:" +
    childEnv.PORT +
    " (if that port is busy, the server picks the next free one — check the log line \"serving on port\").",
);
console.log("[local-db] Using DATABASE_URL ->", databaseUrl.replace(/:[^:@]+@/, ":****@"));
const dev = spawn("npm", ["run", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...childEnv, DATABASE_URL: databaseUrl },
});
dev.on("close", async (exitCode) => {
  if (embedded) {
    try {
      await embedded.stop();
    } catch {
      /* ignore */
    }
  }
  process.exit(exitCode ?? 0);
});
