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

export function glassPeriods(series: SavingsSeries): GlassPeriod[] {
  return series.days.map((d) => ({ from: d.day, to: d.day, savedPence: d.savedPence, investedPence: d.investedPence }));
}
