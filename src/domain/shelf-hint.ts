/** The shelf's empty state: shown instead of the pace and compound sums until the first press. */
export const EMPTY_SHELF_HINT = "Tap the cup every time you walk past the café.";

export function shelfHint(_presses: readonly unknown[]): string | null {
  return EMPTY_SHELF_HINT;
}
