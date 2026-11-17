/**
 * Ticket 33: the latte graph on the shelf, as numbers. One glass per period,
 * oldest first; each carries the running totals at the end of its period.
 * Built on savingsSeries (ticket 32), whose days are local calendar days.
 */
import type { SavingsSeries } from "./savings-series";

/** One glass: the local days it covers ("YYYY-MM-DD", both counted) and the running totals at the end of `to`. */
export interface GlassPeriod {
  from: string;
  to: string;
  savedPence: number;
  investedPence: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Up to this many days of series: one glass a day. */
const DAILY_DAYS = 7;
/** The row never holds more glasses than this. */
export const MAX_GLASSES = 7;

/** Day number of a "YYYY-MM-DD" label, counted as savings-series.ts counts (UTC midnight of the local date). */
const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;

/** The Monday starting the week holding `day`. 1970-01-01 (day 0) was a Thursday. */
const weekOf = (day: string) => {
  const n = dayNumber(day);
  return n - ((n + 3) % 7);
};

/** Consecutive days sharing a key make one glass, carrying the totals of its last day. */
function group(series: SavingsSeries, key: (day: string) => string | number): GlassPeriod[] {
  const out: GlassPeriod[] = [];
  let current: string | number | undefined;
  for (const d of series.days) {
    const k = key(d.day);
    if (out.length === 0 || k !== current) {
      out.push({ from: d.day, to: d.day, savedPence: 0, investedPence: 0 });
      current = k;
    }
    const glass = out[out.length - 1];
    glass.to = d.day;
    glass.savedPence = d.savedPence;
    glass.investedPence = d.investedPence;
  }
  return out;
}

/**
 * Never more than seven glasses: one a day while the series spans seven days
 * (it always spans at least seven); then one per Monday-to-Sunday week, the
 * last being this week so far.
 */
export function glassPeriods(series: SavingsSeries): GlassPeriod[] {
  if (series.days.length <= DAILY_DAYS) return group(series, (day) => day);
  const weekly = group(series, weekOf);
  if (weekly.length <= MAX_GLASSES) return weekly;
  return group(series, (day) => day.slice(0, 7));
}
