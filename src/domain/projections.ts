import type { Press } from "./store";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local-calendar day number; Date.UTC keeps daylight-saving shifts out of the count. */
function dayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS;
}

/**
 * This year's pence extrapolated to the end of 31 December, measured from the
 * user's first press rather than from 1 January:
 *  - The window starts on the local day of the earliest press at or before
 *    `now`; if that day is in an earlier year, it starts on 1 January.
 *  - Saved = presses this calendar year at or before `now`.
 *  - Pace = saved / days from window start to today (both counted)
 *    * days from window start to 31 December (both counted). Rounded to pence.
 *  - No presses: 0. Undone presses are deleted from the ledger, so they never
 *    count, not even as the first press.
 */
export function paceToYearEnd(presses: Press[], now: Date): number {
  const year = now.getFullYear();
  const past = presses.filter((p) => p.at <= now.getTime());
  if (past.length === 0) return 0;
  const yearToDate = past
    .filter((p) => new Date(p.at).getFullYear() === year)
    .reduce((sum, p) => sum + p.pricePence, 0);
  const firstDay = dayNumber(new Date(Math.min(...past.map((p) => p.at))));
  const start = Math.max(firstDay, dayNumber(new Date(year, 0, 1)));
  const daysElapsed = dayNumber(now) - start + 1;
  const daysInWindow = dayNumber(new Date(year + 1, 0, 1)) - start;
  return Math.round((yearToDate / daysElapsed) * daysInWindow);
}

/** Annual compounding: principal * (1 + rate)^years, rounded to pence. */
export function compound(principalPence: number, rate: number, years: number): number {
  return Math.round(principalPence * (1 + rate) ** years);
}
