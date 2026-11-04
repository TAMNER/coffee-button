import type { Clipboard } from "../adapters/clipboard";
import type { Clock } from "../adapters/clock";
import type { UrlOpener } from "../adapters/open-url";
import { formatPounds } from "./money";
import type { PendingInvest, Press, Settlement, Store } from "./store";

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

const REMINDER_EVERY_DAYS = 7;

/** Local calendar day number, so daylight-saving shifts do not move the week. */
function dayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
}

/**
 * The shelf's reminder line for `now`, at most once every seven days
 * (DESIGN.md: one reminder line per week). Showing it records the day in settings.
 */
export async function weeklyOverdueLine(store: Store, now: Date): Promise<string | null> {
  const line = overdueLine(now, await owedSince(store, now), await owed(store, now));
  if (line === null) return null;
  const settings = await store.getSettings();
  const shownAt = settings.overdueShownAt;
  if (shownAt !== undefined && dayNumber(now) - dayNumber(new Date(shownAt)) < REMINDER_EVERY_DAYS) return null;
  await store.putSettings({ ...settings, overdueShownAt: now.getTime() });
  return line;
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

export interface InvestDeps {
  store: Store;
  clock: Clock;
  clipboard: Clipboard;
  opener: UrlOpener;
  /** Called after a confirmed settlement is persisted (the UI emits 'settle' on the bus). */
  onSettled?: (settlement: Settlement) => void | Promise<void>;
}

/** How long an unanswered Invest tap is still asked about after a restart. */
export const PENDING_INVEST_MAX_MS = 24 * 60 * 60 * 1000;

/** Invest £X → copy, open the user's destination (if any), ask on return, settle on yes. */
export class InvestFlow {
  private promptListeners = new Set<(text: string) => void>();
  private stopWaiting: (() => void) | null = null;
  /** The amount and the Invest tap's time, until the user answers. */
  private pending: PendingInvest | null = null;
  /** settings.investUrl as last read by resume(); blank means copy only. */
  private destination = "";

  constructor(private deps: InvestDeps) {}

  /** `fn` receives the confirmation question when the user returns to the app. */
  onPrompt(fn: (text: string) => void): () => void {
    this.promptListeners.add(fn);
    return () => this.promptListeners.delete(fn);
  }

  /**
   * On boot and on every return: reads the destination (so invest() can open it
   * with no await first), and if an Invest tap is still unanswered (the app may
   * have been killed while the user was away), asks about it now.
   */
  async resume(): Promise<void> {
    const { pendingInvest: saved, investUrl } = await this.deps.store.getSettings();
    this.destination = investUrl?.trim() ?? "";
    if (!saved) return;
    if (this.deps.clock.now().getTime() - saved.startedAt > PENDING_INVEST_MAX_MS) {
      await this.savePending(null); // too old to be a fresh trip away
      return;
    }
    this.pending = saved;
    this.ask(saved.amountPence);
  }

  private ask(amountPence: number): void {
    for (const fn of this.promptListeners) fn(`Did you invest ${formatPounds(amountPence)}?`);
  }

  private async savePending(pending: PendingInvest | null): Promise<void> {
    const { pendingInvest: _old, ...settings } = await this.deps.store.getSettings();
    await this.deps.store.putSettings(pending ? { ...settings, pendingInvest: pending } : settings);
  }

  /**
   * "Yes": records the pending amount, settled as of the Invest tap (not now:
   * presses made while the prompt was up were not in that amount), then calls onSettled.
   */
  async yes(): Promise<Settlement | null> {
    const pending = this.pending;
    if (pending === null) return null;
    this.pending = null;
    // Cleared before settling: if the app dies in between, the money shows as
    // owed again (safe) rather than being asked about and settled twice.
    await this.savePending(null);
    const settlement = await settle(this.deps.store, pending.amountPence, new Date(pending.startedAt));
    await this.deps.onSettled?.(settlement);
    return settlement;
  }

  /** "Not yet": drops the pending amount; it stays owed. */
  async notYet(): Promise<void> {
    this.pending = null;
    await this.savePending(null);
  }

  async invest(amountPence: number): Promise<void> {
    this.pending = { amountPence, startedAt: this.deps.clock.now().getTime() };
    this.stopWaiting?.();
    this.stopWaiting = this.deps.opener.onReturn(() => {
      this.stopWaiting?.();
      this.stopWaiting = null;
      this.ask(amountPence);
    });
    // Both start before any await: Safari only allows them inside the tap's user activation.
    // A refused copy (iOS NotAllowedError) must not abort the trip: the amount
    // is on the Invest button and in the question, so the user can type it.
    const copied = this.deps.clipboard.writeText(formatPounds(amountPence).slice(1)).then(
      () => true,
      () => false,
    );
    const opened = this.destination ? this.deps.opener.open(this.destination) : null;
    await this.savePending(this.pending);
    await copied;
    await opened;
  }
}
