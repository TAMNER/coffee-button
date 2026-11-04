import { formatPounds } from "./money";
import type { Item } from "./store";

/** The ring's bottom arc for an item: its name in capitals and its price, e.g. "COFFEE £3.50". */
export function ringLabel(item: Item): string {
  return `${item.name.toUpperCase()} ${formatPounds(item.pricePence)}`;
}
