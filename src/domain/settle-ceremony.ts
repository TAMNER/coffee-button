import type { Settlement, Store } from "./store";

/** The settle ceremony's numbers (DESIGN.md: coins cascade out of the cup, lifetime total ticks up). */

/** Most coins drawn in one cascade, for performance on the phone. */
export const MAX_CASCADE_COINS = 40;

/** One coin per press settled, capped at MAX_CASCADE_COINS. */
export function cascadeCount(pressesSettled: number): number {
  return Math.min(pressesSettled, MAX_CASCADE_COINS);
}

/**
 * The values a ticking total shows, in whole pence: `steps + 1` frames,
 * starting at `fromPence` and ending exactly at `toPence`.
 */
export function tickerFrames(fromPence: number, toPence: number, steps: number): number[] {
  const frames: number[] = [];
  for (let i = 0; i < steps; i++) {
    frames.push(fromPence + Math.round(((toPence - fromPence) * i) / steps));
  }
  frames.push(toPence);
  return frames;
}

export interface SettleCeremonyPlan {
  /** Coins cascading out of the cup. */
  coins: number;
  /** Lifetime invested (every settlement) before and after this one. */
  fromPence: number;
  toPence: number;
}

/** What the ceremony shows for a settlement that is already in the store. */
export async function settleCeremonyPlan(store: Store, settlement: Settlement): Promise<SettleCeremonyPlan> {
  const earlier = (await store.settlements.list()).filter(
    (s) => s.id !== settlement.id && s.at <= settlement.at,
  );
  const previousAt = earlier.length ? Math.max(...earlier.map((s) => s.at)) : null;
  const pressesSettled = (await store.presses.list()).filter(
    (p) => p.at <= settlement.at && (previousAt === null || p.at > previousAt),
  ).length;
  const fromPence = earlier.reduce((sum, s) => sum + s.amountPence, 0);
  return { coins: cascadeCount(pressesSettled), fromPence, toPence: fromPence + settlement.amountPence };
}
