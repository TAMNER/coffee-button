/**
 * Per-press Starling Space transfers (ticket 20).
 */
import type { Press } from "./store";

const isWaiting = (p: Press) => p.transfer?.state === "waiting";

/** How many presses still have money to move. */
export function waitingCount(presses: readonly Press[]): number {
  return presses.filter(isWaiting).length;
}

/** Pence still to move into the Space. */
export function waitingTotal(presses: readonly Press[]): number {
  return presses.filter(isWaiting).reduce((sum, p) => sum + p.pricePence, 0);
}
