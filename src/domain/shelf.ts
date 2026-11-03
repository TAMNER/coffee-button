import type { Goal, Store } from "./store";

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

const pounds = (n: number) => n * 100;

/** Rough prices; the user can edit them (stored in settings). */
export const DEFAULT_SHELF_ITEMS: readonly ShelfItem[] = [
  { id: "laptop", name: "Laptop", pricePence: pounds(1000) },
  { id: "ski-week", name: "Ski week", pricePence: pounds(1500) },
  { id: "long-haul-flight", name: "Long-haul flight", pricePence: pounds(800) },
  { id: "used-car", name: "Used car", pricePence: pounds(5000) },
  { id: "espresso-machine", name: "Espresso machine", pricePence: pounds(400) },
  { id: "bike", name: "Bike", pricePence: pounds(600) },
  { id: "weekend-away", name: "Weekend away", pricePence: pounds(300) },
  { id: "phone", name: "Phone", pricePence: pounds(900) },
  { id: "camera", name: "Camera", pricePence: pounds(700) },
  { id: "festival-ticket", name: "Festival ticket", pricePence: pounds(350) },
];

/** The default shelf items with any prices the user has edited. */
export async function shelfItems(store: Store): Promise<ShelfItem[]> {
  const prices = (await store.getSettings()).shelfPrices ?? {};
  return DEFAULT_SHELF_ITEMS.map((item) => ({ ...item, pricePence: prices[item.id] ?? item.pricePence }));
}

export const MAX_GOALS = 3;

/** Adds a personal goal; throws once there are already three. */
export async function addGoal(
  store: Store,
  name: string,
  pricePence: number,
  newId: () => string = () => crypto.randomUUID(),
): Promise<Goal> {
  if ((await store.goals.list()).length >= MAX_GOALS) {
    throw new Error(`At most ${MAX_GOALS} goals`);
  }
  const goal: Goal = { id: newId(), name, pricePence };
  await store.goals.put(goal);
  return goal;
}

export function removeGoal(store: Store, id: string): Promise<void> {
  return store.goals.delete(id);
}

export async function setShelfPrice(store: Store, id: string, pricePence: number): Promise<void> {
  const settings = await store.getSettings();
  await store.putSettings({ ...settings, shelfPrices: { ...settings.shelfPrices, [id]: pricePence } });
}
