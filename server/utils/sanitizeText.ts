export function fixMathSymbols(text: string) {
  return text
    .replace(/÷/g, "/")
    .replace(/×/g, "*")
    .replace(/−/g, "-")
    .replace(/√/g, "sqrt")
    .replace(/π/g, "pi");
}

export function sanitizeText(text: string): string {
  return fixMathSymbols(
    text
      .normalize("NFKD")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'"),
  );
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Recursively sanitize all string values in JSON-like data structures.
 * Keeps numbers/booleans/null as-is.
 */
export function sanitizeJsonStrings<T>(value: T): T {
  if (typeof value === "string") return sanitizeText(value) as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeJsonStrings(v)) as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeJsonStrings(v);
    }
    return out as T;
  }
  return value;
}

export function sanitizeRecordStrings<T extends Record<string, unknown>>(record: T): T {
  const out: Record<string, unknown> = { ...record };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "string") out[k] = sanitizeText(v);
  }
  return out as T;
}

