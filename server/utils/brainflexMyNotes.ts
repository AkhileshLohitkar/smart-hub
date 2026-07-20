/**
 * Brain-Flex ← My Notes bridge (optional enrichment only).
 * Does not change My Notes upload/OCR/storage APIs or schema.
 * Only used when Curriculum Focus is present.
 */

import type { ContentUpload } from "@shared/schema";
import { storage } from "../storage";
import type { BrainFlexContext } from "./brainflexContext";
import { isGenericBrainFlexSubject } from "./brainflexContext";
import { seededShuffle } from "./brainflexUniqueness";
const MAX_CHARS = 3500;
const MAX_VOCAB = 40;

function norm(s: string | undefined | null): string {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function scoreNote(
  note: ContentUpload,
  opts: { board?: string; className?: string; subject?: string; chapter?: string; topic?: string },
): number {
  let score = 0;
  const nSubject = norm(note.subject);
  const nBoard = norm(note.board);
  const nClass = norm(note.className);
  const nChapter = norm(note.chapter);
  const nTopic = norm(note.topic);

  const subject = norm(opts.subject);
  const board = norm(opts.board);
  const className = norm(opts.className);
  const chapter = norm(opts.chapter);
  const topic = norm(opts.topic);

  if (subject && nSubject.includes(subject)) score += 5;
  if (subject && subject.includes(nSubject) && nSubject.length >= 3) score += 3;

  if (className && (nClass.includes(className) || className.includes(nClass))) score += 4;

  if (board && nBoard && (nBoard.includes(board) || board.includes(nBoard))) score += 3;

  const focusBits = [chapter, topic].filter(Boolean);
  for (const bit of focusBits) {
    if (!bit) continue;
    if (nChapter.includes(bit) || bit.includes(nChapter)) score += 5;
    if (nTopic.includes(bit) || bit.includes(nTopic)) score += 5;
  }

  if (String(note.extractedText || "").trim().length > 80) score += 1;
  return score;
}

/** Extract educational-looking vocabulary tokens from note text. */
export function extractVocabFromNotesText(
  text: string,
  opts?: { minLen?: number; maxLen?: number; limit?: number; seed?: number },
): string[] {
  const minLen = opts?.minLen ?? 4;
  const maxLen = opts?.maxLen ?? 12;
  const limit = opts?.limit ?? MAX_VOCAB;
  const seen = new Set<string>();
  const candidates: string[] = [];

  const tokens = String(text || "").match(/[A-Za-z][A-Za-z'-]{2,}/g) ?? [];
  for (const raw of tokens) {
    const u = raw.toUpperCase().replace(/[^A-Z]/g, "");
    if (u.length < minLen || u.length > maxLen) continue;
    if (seen.has(u)) continue;
    if (
      /^(THIS|THAT|WITH|FROM|HAVE|WILL|THEY|THEM|THEN|THAN|WHEN|WHAT|WHERE|WHICH|WHILE|ABOUT|THERE|THEIR|WOULD|COULD|SHOULD|BEING|OTHER|AFTER|BEFORE|UNDER|OVER|INTO|ALSO|ONLY|JUST|SOME|MORE|MOST|VERY|EACH|EVERY|SUCH)$/.test(
        u,
      )
    ) {
      continue;
    }
    seen.add(u);
    candidates.push(u);
  }

  const ordered =
    opts?.seed != null ? seededShuffle(candidates, opts.seed) : candidates;
  return ordered.slice(0, limit);
}

/**
 * Keep prompt size reasonable: prefer paragraphs matching chapter/topic keywords,
 * then fill remaining budget with leading content. Deduplicate near-identical blocks.
 */
function compressNotesText(
  notes: ContentUpload[],
  focus: { subject?: string; chapter?: string; topic?: string },
): string {
  const keywords = [focus.subject, focus.chapter, focus.topic]
    .map(norm)
    .filter((k) => k.length >= 3);

  const chunks: string[] = [];
  const seen = new Set<string>();

  for (const note of notes) {
    const label = [note.board, note.className, note.subject, note.chapter || note.topic]
      .filter(Boolean)
      .join(" · ");
    const body = String(note.extractedText || "").replace(/\s+/g, " ").trim();
    if (!body) continue;

    const paragraphs = body
      .split(/(?<=[.!?])\s+|\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40);

    const scored = paragraphs
      .map((p) => {
        const lower = p.toLowerCase();
        const hits = keywords.reduce((n, k) => n + (lower.includes(k) ? 1 : 0), 0);
        return { p, hits };
      })
      .sort((a, b) => b.hits - a.hits || b.p.length - a.p.length);

    const picked =
      scored.filter((s) => s.hits > 0).slice(0, 8).map((s) => s.p).join(" ") ||
      paragraphs.slice(0, 4).join(" ") ||
      body.slice(0, 1200);

    const key = picked.slice(0, 120).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    chunks.push(`[Note: ${label}]\n${picked}`);
  }

  let combined = chunks.join("\n\n");
  if (combined.length > MAX_CHARS) {
    combined = `${combined.slice(0, MAX_CHARS)}\n…[truncated for length]`;
  }
  return combined.trim();
}

export type BrainFlexNotesEnrichment = {
  notesContext: string;
  notesVocab: string[];
};

/**
 * Resolve matching My Notes for the current user when Curriculum Focus is set.
 * Returns empty enrichment (no errors) when focus is empty or no notes match.
 */
export async function resolveBrainFlexNotesEnrichment(
  userId: number | undefined,
  ctx: BrainFlexContext | undefined,
): Promise<BrainFlexNotesEnrichment> {
  const empty: BrainFlexNotesEnrichment = { notesContext: "", notesVocab: [] };

  if (userId == null || !ctx) return empty;
  if (isGenericBrainFlexSubject(ctx.subject) && !ctx.topic?.trim()) return empty;

  try {
    const className = String(ctx.grade || "").trim();
    const subject = String(ctx.subject || "").trim();
    const topicHint = String(ctx.topic || "").trim() || undefined;

    // Need at least a real subject or a topic/chapter focus to match notes.
    const hasRealSubject = Boolean(subject) && !isGenericBrainFlexSubject(subject);
    if (!hasRealSubject && !topicHint) return empty;

    const searchSubject = hasRealSubject ? subject : topicHint!;
    const searchClass = className || "Grade";

    // Existing search is user-scoped; load a few candidates then rank locally (board/chapter).
    let pool = await storage.searchContentUploads(
      userId,
      searchClass,
      searchSubject,
      topicHint,
    );

    if (pool.length === 0 && className && hasRealSubject) {
      pool = await storage.searchContentUploads(userId, className, subject, undefined);
    }

    if (pool.length === 0) {
      // Fall back: all user notes filtered by subject/topic (still user-scoped)
      const all = await storage.getUserContentUploads(userId);
      pool = all.filter((n) => {
        const ns = norm(n.subject);
        const nc = norm(n.chapter);
        const nt = norm(n.topic);
        if (hasRealSubject) {
          const s = norm(subject);
          if (ns.includes(s) || s.includes(ns)) return true;
        }
        if (topicHint) {
          const t = norm(topicHint);
          if (nc.includes(t) || nt.includes(t) || t.includes(nc) || t.includes(nt)) return true;
        }
        return false;
      });
    }

    if (pool.length === 0) return empty;

    const ranked = [...pool]
      .map((n) => ({
        n,
        score: scoreNote(n, {
          board: ctx.board,
          className: ctx.grade,
          subject: ctx.subject,
          chapter: ctx.topic,
          topic: ctx.topic,
        }),
      }))
      .filter((x) => x.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          new Date(b.n.createdAt ?? 0).getTime() - new Date(a.n.createdAt ?? 0).getTime(),
      )
      .slice(0, MAX_NOTES)
      .map((x) => x.n);

    if (ranked.length === 0) return empty;

    // Merge all matched notes into one unified excerpt for knowledge extraction.
    const noteSeed = (ctx.generationSeed ?? Date.now()) + (ctx.generationAttempt ?? 0) * 131;
    const mergedNotes = seededShuffle(ranked, noteSeed);

    const notesContext = compressNotesText(mergedNotes, {
      subject: ctx.subject,
      chapter: ctx.topic,
      topic: ctx.topic,
    });
    if (!notesContext) return empty;

    const notesVocab = extractVocabFromNotesText(notesContext, {
      limit: MAX_VOCAB,
      seed: noteSeed,
    });

    console.log(
      `[BrainFlex×Notes] user=${userId} matched=${ranked.length} merged=${mergedNotes.length} chars=${notesContext.length} vocab=${notesVocab.length}`,
    );

    return { notesContext, notesVocab };
  } catch (err) {
    console.warn("[BrainFlex×Notes] lookup failed (continuing without notes):", err);
    return empty;
  }
}

/** Block to append to LLM prompts — empty string when unused. */
export function formatNotesPromptBlock(notesContext: string | undefined): string {
  const text = String(notesContext || "").trim();
  if (!text) return "";
  return `

STUDENT'S MY NOTES (reference material for this user only):
Use these notes to improve educational quality, accurate terminology, age-appropriate vocabulary, clues, questions, and topic relevance.
Do NOT invent facts that contradict the notes. Prefer note terminology when it fits the Curriculum Focus.
Treat the notes as supporting reference — stay within the given board/grade/subject/topic.

-----
${text}
-----
`;
}
