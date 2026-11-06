import { YEAR_MAX, YEAR_MIN, clamp } from "../sim/model";

/** Allow empty or partial numeric draft while typing; never clamp mid-keystroke. */
export function isValidYearDraft(raw: string): boolean {
  if (raw.trim() === "") return true;
  return /^\d{0,4}$/.test(raw.trim());
}

export function parseYearDraft(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  if (!/^\d{1,4}$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Commit draft on blur/Enter: empty → fallback; out-of-range → clamp. */
export function commitYearDraft(raw: string, fallback: number): number {
  const n = parseYearDraft(raw);
  if (n == null) return clamp(fallback, YEAR_MIN, YEAR_MAX);
  return clamp(Math.round(n), YEAR_MIN, YEAR_MAX);
}

export function yearDraftFromCommitted(year: number): string {
  return String(clamp(Math.round(year), YEAR_MIN, YEAR_MAX));
}
