/**
 * Normalize text for jsPDF + Helvetica (WinAnsi). Strips emojis and unsupported Unicode
 * so PDF output does not show mojibake like "Ø=Ý".
 */
export function sanitizePdfText(text: unknown): string {
  let s = String(text ?? "");

  // Double ampersand / HTML entity leftovers
  s = s.replace(/&&/g, "&");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&nbsp;/g, " ");

  // Smart quotes and apostrophes
  s = s.replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'");
  s = s.replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"');

  // Dashes
  s = s.replace(/[\u2013\u2014\u2212]/g, "-");

  // Arrows (including mojibake-prone variants)
  s = s.replace(/[\u2190-\u2199\u2794\u27A1\uFE0F]/g, "->");
  s = s.replace(/!\u2019/g, "->");
  s = s.replace(/!\u2019/g, "->");

  // Bullets and list markers
  s = s.replace(/[\u2022\u2023\u25E6\u2043\u2219\u00B7\u25AA\u25AB]/g, "-");

  // Emoji & pictographs (section icons, decorative symbols)
  s = s.replace(/[\u{1F000}-\u{1FAFF}]/gu, "");
  s = s.replace(/[\u2600-\u27BF]/g, "");

  // Remaining non-ASCII → space (Helvetica-safe printable ASCII only)
  s = s.replace(/[^\x20-\x7E\n\r\t]/g, " ");

  // Collapse whitespace (keep newlines for splitTextToSize input if present)
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n[ \t]+/g, "\n");
  return s.trim();
}

/** Join PDF-safe list items (replaces bullet separators). */
export function joinPdfList(items: string[], separator = " | "): string {
  return items.map((item) => sanitizePdfText(item)).filter(Boolean).join(separator);
}
