/**
 * How the shelf screen splits its entries into planks (ticket 16). Goals (at
 * most MAX_GOALS = 3) stand on their own plank on top; the four built-in items
 * stand two and two below. Two to a plank, because shelf.css sizes each item
 * at a third of the row with 94px art and centres the row: two centred items
 * read well at 390px, while four across would squeeze the art below its width.
 */
export const GOALS_PER_ROW = 3;
export const ITEMS_PER_ROW = 2;

function chunk<T>(entries: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < entries.length; i += size) rows.push(entries.slice(i, i + size));
  return rows;
}

/** Goal planks first, then built-in item planks; never an empty plank. */
export function shelfRows<T>(goals: readonly T[], items: readonly T[]): T[][] {
  return [...chunk(goals, GOALS_PER_ROW), ...chunk(items, ITEMS_PER_ROW)];
}
