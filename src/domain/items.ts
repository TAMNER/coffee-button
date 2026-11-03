import { DEFAULT_ITEMS, type Item, type Store } from "./store";

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

/**
 * The store's items in cycling order: the default items first, in their
 * seeded order, then the rest as the store lists them. IndexedDB lists by key,
 * which would put Beer before Coffee, so the order is fixed here.
 */
export async function listItems(store: Store): Promise<Item[]> {
  const rank = (item: Item) => {
    const i = DEFAULT_ITEMS.findIndex((d) => d.id === item.id);
    return i < 0 ? DEFAULT_ITEMS.length : i;
  };
  return (await store.items.list()).sort((a, b) => rank(a) - rank(b));
}

/**
 * Adds any default item an existing install lacks (installs from before Beer
 * was a default). An item with the same id, or one the user added under the
 * same name, counts as present, so it never adds a second Beer.
 */
export async function ensureDefaultItems(store: Store): Promise<void> {
  const items = await store.items.list();
  const has = (d: Item) =>
    items.some((item) => item.id === d.id || item.name.trim().toLowerCase() === d.name.toLowerCase());
  for (const item of DEFAULT_ITEMS) {
    if (!has(item)) await store.items.put(item);
  }
}
