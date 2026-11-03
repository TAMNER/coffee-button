/** Something on the shelf: a default big-ticket item or a personal goal. */
export interface ShelfItem {
  id: string;
  name: string;
  pricePence: number;
}

export interface ShelfEntry extends ShelfItem {
  /** Lifetime total has reached the price: "you could now buy this". */
  lit: boolean;
  /** Lifetime / price, capped at 1. */
  progress: number;
}

export function shelfState(items: ShelfItem[], lifetimePence: number): ShelfEntry[] {
  return items.map((item) => ({
    ...item,
    lit: lifetimePence >= item.pricePence,
    progress: Math.min(1, lifetimePence / item.pricePence),
  }));
}
