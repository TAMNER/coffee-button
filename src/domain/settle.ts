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
