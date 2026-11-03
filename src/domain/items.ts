import type { Item } from "./store";

/** The id of the item after `activeId` in list order, wrapping to the first. */
export function nextItem(items: readonly Item[], activeId: string): string {
  const i = items.findIndex((item) => item.id === activeId);
  return items[(i + 1) % items.length].id;
}
