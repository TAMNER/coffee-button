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
