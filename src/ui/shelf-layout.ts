/**
 * How the shelf screen lays its targets on planks. Ticket 30: one plank of at
 * most MAX_TARGETS = 3, already sorted cheapest first by domain/shelf.ts.
 * shelf.css sizes each target at a third of the row with 94px art and centres
 * the row, so one, two or three read well at 390px. (Before ticket 30, goals
 * had a plank of three on top and four built-ins stood two and two below.)
 */
export const TARGETS_PER_ROW = 3;
/** Superseded by TARGETS_PER_ROW (ticket 30); no longer used. */
export const GOALS_PER_ROW = 3;
/** Superseded by TARGETS_PER_ROW (ticket 30); no longer used. */
export const ITEMS_PER_ROW = 2;

/** One plank holding the targets; never an empty plank. */
export function shelfRows<T>(targets: readonly T[]): T[][] {
  return targets.length === 0 ? [] : [targets.slice(0, TARGETS_PER_ROW)];
}
