/**
 * Ticket 35: open the app as if today were another date, to walk "Invest £X"
 * on any day. Look-only for money: nothing pressed or invested is saved, and
 * no money moves.
 */
import type { Clock } from "../adapters/clock";

/** The pretend date from a date field's "YYYY-MM-DD" (local midnight), or null for anything that is not a real date. */
export function parsePretendDate(raw: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw ?? "");
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  // new Date rolls 30 February over into March; a real date comes back unchanged.
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

/** A clock that reads `day` at the real clock's time of day, so time still passes on the pretend date. */
export function pretendClock(day: Date, real: Clock): Clock {
  return {
    now() {
      const t = real.now();
      return new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds());
    },
  };
}
