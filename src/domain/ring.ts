import { listItems } from "./items";
import { formatPounds } from "./money";
import { activeItemId } from "./settings";
import type { Item, Store } from "./store";

/** The ring's bottom arc for an item: its name in capitals and its price, e.g. "COFFEE £3.50". */
export function ringLabel(item: Item): string {
  return `${item.name.toUpperCase()} ${formatPounds(item.pricePence)}`;
}

/** The ring label for the stored active item at its stored price (so a reprice shows on the next mount). */
export async function activeRingLabel(store: Store): Promise<string> {
  const [items, id] = await Promise.all([listItems(store), activeItemId(store)]);
  return ringLabel(items.find((item) => item.id === id) ?? items[0]);
}
