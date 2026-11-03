import type { Clipboard } from "../adapters/clipboard";
import type { Clock } from "../adapters/clock";
import type { UrlOpener } from "../adapters/open-url";
import { formatPounds } from "./money";
import type { Press, Settlement, Store } from "./store";

/** Latest settlement time at or before `now`, or null if never settled. */
async function lastSettlementAt(store: Store, now: Date): Promise<number | null> {
  const times = (await store.settlements.list()).map((s) => s.at).filter((at) => at <= now.getTime());
  return times.length ? Math.max(...times) : null;
}

/** Presses after the last settlement, or every press if never settled. */
async function owedPresses(store: Store, now: Date): Promise<Press[]> {
  const since = await lastSettlementAt(store, now);
  const presses = await store.presses.list();
  return presses.filter((p) => p.at <= now.getTime() && (since === null || p.at > since));
}

/** Pence owed: every press after the last settlement, or every press if never settled. */
export async function owed(store: Store, now: Date): Promise<number> {
  return (await owedPresses(store, now)).reduce((sum, p) => sum + p.pricePence, 0);
}

/** When the owed balance started: the oldest unsettled press, or null when nothing is owed. */
export async function owedSince(store: Store, now: Date): Promise<Date | null> {
  const times = (await owedPresses(store, now)).map((p) => p.at);
  return times.length ? new Date(Math.min(...times)) : null;
}

/** Records that `amountPence` was invested at `at`; everything pressed up to then is settled. */
export async function settle(
  store: Store,
  amountPence: number,
  at: Date,
  newId: () => string = () => crypto.randomUUID(),
): Promise<Settlement> {
  const settlement: Settlement = { id: newId(), amountPence, at: at.getTime() };
  await store.settlements.put(settlement);
  return settlement;
}

/**
 * Whether the main screen offers "Invest £X". Open from the day after payday,
 * and on any day while money owed from an earlier month is still unsettled.
 * `owedSince` is the oldest unsettled press (see owedSince()).
 */
export function isSettleWindow(now: Date, payday: number, owedSince: Date | null, owedPence: number): boolean {
  return owedPence > 0 && (now.getDate() > payday || isOverdue(now, owedSince));
}

/** The shelf's reminder, e.g. "£12.50 owed since October", or null when nothing is overdue. */
export function overdueLine(now: Date, owedSince: Date | null, owedPence: number): string | null {
  if (owedPence <= 0 || !owedSince || !isOverdue(now, owedSince)) return null;
  return `${formatPounds(owedPence)} owed since ${MONTHS[owedSince.getMonth()]}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Owed money dates from before this calendar month, so last month's window passed unsettled. */
function isOverdue(now: Date, owedSince: Date | null): boolean {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return owedSince !== null && owedSince < monthStart;
}

/** Universal link: opens the InvestEngine app when installed, the website otherwise. */
export const INVESTENGINE_URL = "https://investengine.com/";
/** Fallback when the universal link cannot be opened. */
export const APP_STORE_URL = "https://apps.apple.com/gb/app/investengine/id1485669937";

export interface InvestDeps {
  store: Store;
  clock: Clock;
  clipboard: Clipboard;
  opener: UrlOpener;
}

/** Invest £X → copy, open InvestEngine, ask on return, settle on yes. */
export class InvestFlow {
  private promptListeners = new Set<(text: string) => void>();
  private stopWaiting: (() => void) | null = null;

  constructor(private deps: InvestDeps) {}

  /** `fn` receives the confirmation question when the user returns from InvestEngine. */
  onPrompt(fn: (text: string) => void): () => void {
    this.promptListeners.add(fn);
    return () => this.promptListeners.delete(fn);
  }

  async invest(amountPence: number): Promise<void> {
    this.stopWaiting?.();
    this.stopWaiting = this.deps.opener.onReturn(() => {
      this.stopWaiting?.();
      this.stopWaiting = null;
      for (const fn of this.promptListeners) fn(`Did you invest ${formatPounds(amountPence)}?`);
    });
    // Both start before any await: Safari only allows them inside the tap's user activation.
    const copied = this.deps.clipboard.writeText(formatPounds(amountPence).slice(1));
    const opened = this.deps.opener.open(INVESTENGINE_URL);
    await copied;
    if (!(await opened)) await this.deps.opener.open(APP_STORE_URL);
  }
}
