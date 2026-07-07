/** Public answer-key route for a generated worksheet (all modules share worksheets.id). */
export function getAnswerKeyPath(worksheetId: number): string {
  return `/answer-key/${worksheetId}`;
}

export function getAnswerKeyUrl(worksheetId: number, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    "";
  return `${base}${getAnswerKeyPath(worksheetId)}`;
}
