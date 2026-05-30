/**
 * Resolves DATABASE_URL for local development.
 * Prefer DATABASE_URL, or set DB_HOST / DB_USER / DB_PASSWORD / DB_NAME (and optional DB_PORT).
 */
export function resolveDatabaseUrl(): string | undefined {
  const explicit = process.env.DATABASE_URL?.trim();
  if (explicit) return explicit;

  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "5432";
  const user = process.env.DB_USER ?? "postgres";
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME ?? "smart_edu_hub";

  const u = encodeURIComponent(user);
  const p = encodeURIComponent(password);
  const auth = password === "" ? `${u}@` : `${u}:${p}@`;
  return `postgresql://${auth}${host}:${port}/${database}`;
}
