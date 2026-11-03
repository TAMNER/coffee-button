import type { Item } from "./store";

/** The id of the item after `activeId` in list order, wrapping to the first. */
export function nextItem(items: readonly Item[], activeId: string): string {
  const i = items.findIndex((item) => item.id === activeId);
  return items[(i + 1) % items.length].id;
}

/** The id of the item before `activeId` in list order, wrapping to the last. */
export function prevItem(items: readonly Item[], activeId: string): string {
  const i = items.findIndex((item) => item.id === activeId);
  return items[(i - 1 + items.length) % items.length].id;
}
