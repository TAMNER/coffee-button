/**
 * Ticket 35: open the app as if today were another date, to walk "Invest £X"
 * on any day. Look-only for money: nothing pressed or invested is saved, and
 * no money moves.
 */
import type { Clock } from "../adapters/clock";
import type { MoneyMover, MoveRef, MoveResult } from "./money-mover";
import type { Collection, Store } from "./store";

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

/** Reads pass through; writes and deletes are dropped. `current` is read on every call, since replaceAll may swap the collection. */
function readOnly<T extends { id: string }>(current: () => Collection<T>): Collection<T> {
  return {
    get: (id) => current().get(id),
    list: () => current().list(),
    put: async () => {},
    delete: async () => {},
  };
}

/**
 * The store as the app sees it on a pretend date: presses and settlements are
 * read but never written, so a press or a "Yes" changes neither the ledger nor
 * the owed balance (nor, since the queue is the presses, the Starling queue).
 * Items, goals and settings still save.
 */
export function lookOnlyStore(store: Store): Store {
  return {
    get items() {
      return store.items;
    },
    get goals() {
      return store.goals;
    },
    presses: readOnly(() => store.presses),
    settlements: readOnly(() => store.settlements),
    getSettings: () => store.getSettings(),
    putSettings: (settings) => store.putSettings(settings),
    replaceAll: (snapshot) => store.replaceAll(snapshot),
  };
}

/** The mover on a pretend date: nothing moves, and moverFor never swaps it for a Starling mover. */
export class LookOnlyMover implements MoneyMover {
  async move(_amountPence: number, _ref: MoveRef): Promise<MoveResult> {
    return { ok: true };
  }
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The line shown on every screen while a pretend date is on. */
export function pretendNotice(day: Date): string {
  const date = `${DAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]} ${day.getFullYear()}`;
  return `Pretending today is ${date}. Nothing you press or invest is saved and no money moves.`;
}
