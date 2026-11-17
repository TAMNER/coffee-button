import { MIN_ELAPSED_DAYS } from "./projections";
import type { Press, Settlement } from "./store";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local-calendar day number, as projections.ts counts days; Date.UTC keeps daylight-saving shifts out. */
function dayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS;
}

/** One local day of the series: running totals at the end of that day. */
export interface SavingsDay {
  /** The phone's local calendar day, "YYYY-MM-DD". */
  day: string;
  savedPence: number;
  investedPence: number;
}

/** The series behind the latte graph plus its two headline figures, which always equal the last day's totals. */
export interface SavingsSeries {
  days: SavingsDay[];
  savedPence: number;
  investedPence: number;
}

/**
 * Day by day from the local day of the first press to today (both counted),
 * reaching back far enough to span at least MIN_ELAPSED_DAYS, the pace rule.
 * Each day carries the running totals up to the end of that day. No presses:
 * no days.
 */
export function savingsSeries(presses: Press[], settlements: Settlement[], now: Date): SavingsSeries {
  if (presses.length === 0) return { days: [], savedPence: 0, investedPence: 0 };
  const today = dayNumber(now);
  const firstDay = dayNumber(new Date(Math.min(...presses.map((p) => p.at))));
  const start = Math.min(firstDay, today - MIN_ELAPSED_DAYS + 1);
  const days: SavingsDay[] = [];
  for (let d = start; d <= today; d++) {
    const savedPence = presses.filter((p) => dayNumber(new Date(p.at)) <= d).reduce((sum, p) => sum + p.pricePence, 0);
    days.push({ day: dayLabel(d), savedPence, investedPence: 0 });
  }
  const last = days[days.length - 1];
  return { days, savedPence: last.savedPence, investedPence: last.investedPence };
}

/** "YYYY-MM-DD" for a day number from dayNumber(). */
function dayLabel(d: number): string {
  return new Date(d * DAY_MS).toISOString().slice(0, 10);
}
