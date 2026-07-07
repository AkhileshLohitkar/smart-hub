/** Brain-Flex subjects blocked until language support is added. */
const RESTRICTED_SUBJECTS = new Set(["marathi", "hindi", "sanskrit"]);

export const BRAIN_FLEX_RESTRICTED_SUBJECT_MESSAGE =
  "Brain-Flex is currently available only for English-medium subjects. Marathi, Hindi, and Sanskrit support is coming soon.";

export function isBrainFlexRestrictedSubject(subject: string | undefined | null): boolean {
  const normalized = String(subject ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return RESTRICTED_SUBJECTS.has(normalized);
}
