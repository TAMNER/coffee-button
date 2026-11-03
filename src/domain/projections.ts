import type { Press } from "./store";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local-calendar day number; Date.UTC keeps daylight-saving shifts out of the count. */
function dayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS;
}

/**
 * Year-to-date pence extrapolated to 31 December: total this calendar year,
 * divided by days elapsed (today counts), times days in the year. Rounded to pence.
 */
export function paceToYearEnd(presses: Press[], now: Date): number {
  const year = now.getFullYear();
  const yearToDate = presses
    .filter((p) => {
      const at = new Date(p.at);
      return at.getFullYear() === year && p.at <= now.getTime();
    })
    .reduce((sum, p) => sum + p.pricePence, 0);
  const jan1 = new Date(year, 0, 1);
  const daysElapsed = dayNumber(now) - dayNumber(jan1) + 1;
  const daysInYear = dayNumber(new Date(year + 1, 0, 1)) - dayNumber(jan1);
  return Math.round((yearToDate / daysElapsed) * daysInYear);
}

/** Annual compounding: principal * (1 + rate)^years, rounded to pence. */
export function compound(principalPence: number, rate: number, years: number): number {
  return Math.round(principalPence * (1 + rate) ** years);
}
