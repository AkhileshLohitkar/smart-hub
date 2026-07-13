/**
 * Normalize free-text subject/topic labels to Title Case.
 * Example: "human body" → "Human Body", "ENGLISH" → "English"
 */
export function toTitleCase(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Title-case a string only when it has content; preserves empty/whitespace-only as trimmed empty. */
export function normalizeTitleCaseField(input: string | null | undefined): string {
  if (input == null) return "";
  const trimmed = String(input).trim();
  if (!trimmed) return "";
  return toTitleCase(trimmed);
}
