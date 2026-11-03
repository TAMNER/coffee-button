/** The settle ceremony's numbers (DESIGN.md: coins cascade out of the cup, lifetime total ticks up). */

/** Most coins drawn in one cascade, for performance on the phone. */
export const MAX_CASCADE_COINS = 40;

/** One coin per press settled, capped at MAX_CASCADE_COINS. */
export function cascadeCount(pressesSettled: number): number {
  return Math.min(pressesSettled, MAX_CASCADE_COINS);
}
