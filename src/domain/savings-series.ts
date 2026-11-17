import type { Press, Settlement } from "./store";

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

export function savingsSeries(presses: Press[], settlements: Settlement[], now: Date): SavingsSeries {
  return { days: [], savedPence: 0, investedPence: 0 };
}
