/** Answer keys are stored inside worksheets.content (no separate table). */

export function buildAnswerKeyApiPath(worksheetId: number): string {
  return `/api/answer-key/${worksheetId}`;
}

function sectionHasBrainFlexAnswers(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  if (Array.isArray(d.answers) && d.answers.length > 0) return true;
  if (Array.isArray(d.solution) && d.solution.length > 0) return true;
  if (Array.isArray(d.clues) && d.clues.some((c) => c && typeof c === "object" && "answer" in c)) {
    return true;
  }
  if (Array.isArray(d.items) && d.items.some((i) => i && typeof i === "object" && "answer" in i)) {
    return true;
  }
  if (Array.isArray(d.riddles) && d.riddles.some((r) => r && typeof r === "object" && "answer" in r)) {
    return true;
  }
  if (Array.isArray(d.teasers) && d.teasers.some((t) => t && typeof t === "object" && "answer" in t)) {
    return true;
  }
  if (Array.isArray(d.words) && d.words.some((w) => w && typeof w === "object" && ("answer" in w || "original" in w))) {
    return true;
  }

  return false;
}

/** Returns whether worksheet content includes answer-key data (worksheets, test prep, or brain flex). */
export function hasAnswerKeyInContent(content: unknown, worksheetType?: string | null): boolean {
  if (!content || typeof content !== "object") return false;
  const c = content as Record<string, unknown>;

  if (Array.isArray(c.answerKey) && c.answerKey.length > 0) return true;

  const sections = c.sections;
  if (!Array.isArray(sections)) return false;

  for (const section of sections) {
    if (!section || typeof section !== "object") continue;
    const s = section as Record<string, unknown>;

    const questions = s.questions;
    if (Array.isArray(questions) && questions.some((q) => q && typeof q === "object" && "answer" in q && (q as { answer?: unknown }).answer)) {
      return true;
    }

    if (worksheetType === "brain_flex" || s.data) {
      if (sectionHasBrainFlexAnswers(s.data)) return true;
    }
  }

  return false;
}

export function countAnswerKeyEntries(content: unknown, worksheetType?: string | null): number {
  if (!content || typeof content !== "object") return 0;
  const c = content as Record<string, unknown>;

  if (Array.isArray(c.answerKey)) return c.answerKey.length;

  let count = 0;
  const sections = c.sections;
  if (!Array.isArray(sections)) return 0;

  for (const section of sections) {
    if (!section || typeof section !== "object") continue;
    const s = section as Record<string, unknown>;

    const questions = s.questions;
    if (Array.isArray(questions)) {
      count += questions.filter((q) => q && typeof q === "object" && "answer" in q && (q as { answer?: unknown }).answer).length;
    }

    if (worksheetType === "brain_flex" || s.data) {
      const d = s.data;
      if (d && typeof d === "object") {
        const data = d as Record<string, unknown>;
        if (Array.isArray(data.answers)) count += data.answers.length;
        else if (Array.isArray(data.solution)) count += 1;
        else if (Array.isArray(data.clues)) count += data.clues.length;
        else if (Array.isArray(data.items)) count += data.items.length;
        else if (Array.isArray(data.riddles)) count += data.riddles.length;
        else if (Array.isArray(data.teasers)) count += data.teasers.length;
        else if (Array.isArray(data.words)) count += data.words.length;
      }
    }
  }

  return count;
}
