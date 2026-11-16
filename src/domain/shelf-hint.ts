import type { Press } from "./store";

/** The shelf's empty state: shown instead of the pace and compound sums until the first press. */
export const EMPTY_SHELF_HINT = "Tap the cup every time you walk past the café.";

/**
 * The hint while the ledger holds no presses, else null. Undo deletes the
 * press, so undoing the only press brings the hint back.
 */
export function shelfHint(presses: readonly Press[]): string | null {
  return presses.length === 0 ? EMPTY_SHELF_HINT : null;
}
