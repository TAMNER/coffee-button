import type { Store } from "./store";

/** Latest settlement time at or before `now`, or null if never settled. */
async function lastSettlementAt(store: Store, now: Date): Promise<number | null> {
  const times = (await store.settlements.list()).map((s) => s.at).filter((at) => at <= now.getTime());
  return times.length ? Math.max(...times) : null;
}

/** Pence owed: every press after the last settlement, or every press if never settled. */
export async function owed(store: Store, now: Date): Promise<number> {
  const since = await lastSettlementAt(store, now);
  const presses = await store.presses.list();
  return presses
    .filter((p) => p.at <= now.getTime() && (since === null || p.at > since))
    .reduce((sum, p) => sum + p.pricePence, 0);
}
