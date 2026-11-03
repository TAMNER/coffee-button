import type { Item } from "./store";

/** The id `step` places from `activeId` in list order, wrapping; the first item when `activeId` is unknown. */
function neighbour(items: readonly Item[], activeId: string, step: 1 | -1): string {
  const i = items.findIndex((item) => item.id === activeId);
  if (i < 0) return items[0].id;
  return items[(i + step + items.length) % items.length].id;
}

/** The id of the item after `activeId` in list order, wrapping to the first. */
export function nextItem(items: readonly Item[], activeId: string): string {
  return neighbour(items, activeId, 1);
}

/** The id of the item before `activeId` in list order, wrapping to the last. */
export function prevItem(items: readonly Item[], activeId: string): string {
  return neighbour(items, activeId, -1);
}
