import type { Ledger } from "./ledger";
import { compound, paceToYearEnd } from "./projections";
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

/** Rough prices, cheapest first; the user can edit them (stored in settings). */
export const DEFAULT_SHELF_ITEMS: readonly ShelfItem[] = [
  { id: "weekend-away", name: "Weekend away", pricePence: pounds(300) },
  { id: "espresso-machine", name: "Espresso machine", pricePence: pounds(400) },
  { id: "laptop", name: "Laptop", pricePence: pounds(1000) },
  { id: "ski-week", name: "Ski week", pricePence: pounds(1500) },
];

/** The default shelf items with any prices the user has edited. */
export async function shelfItems(store: Store): Promise<ShelfItem[]> {
  const prices = (await store.getSettings()).shelfPrices ?? {};
  return DEFAULT_SHELF_ITEMS.map((item) => ({ ...item, pricePence: prices[item.id] ?? item.pricePence }));
}

/** A target on the plank: a built-in (with its own drawing) or a goal the user typed. */
export interface ShelfTarget extends ShelfItem {
  builtIn: boolean;
}

const cheapestFirst = <T extends ShelfItem>(a: T, b: T) => a.pricePence - b.pricePence;

/** Ids of the built-ins on the plank. */
export async function plankBuiltInIds(store: Store): Promise<string[]> {
  return (await store.getSettings()).shelfBuiltInIds ?? [];
}

/** Ticket 30: the plank's one list of targets, cheapest first. */
export async function shelfTargets(store: Store): Promise<ShelfTarget[]> {
  const ids = await plankBuiltInIds(store);
  const builtIns = (await shelfItems(store)).filter((item) => ids.includes(item.id));
  const goals = await store.goals.list();
  return [
    ...builtIns.map((item) => ({ ...item, builtIn: true })),
    ...goals.map((goal) => ({ ...goal, builtIn: false })),
  ].sort(cheapestFirst);
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

export const COMPOUND_RATE = 0.05;
export const COMPOUND_YEARS = 10;

/** Everything the shelf screen shows, ready to render. */
export interface ShelfView {
  pacePence: number;
  lifetimePence: number;
  /** Lifetime total compounded at COMPOUND_RATE for COMPOUND_YEARS. */
  compoundedPence: number;
  items: ShelfEntry[];
  goals: ShelfEntry[];
  /** "£X owed since October" when a settle is overdue, else null. */
  overdueLine: string | null;
}

export interface ShelfViewDeps {
  store: Store;
  ledger: Ledger;
  now: Date;
  /** Injected; ticket 06 supplies the real one. */
  overdueLine: (now: Date) => Promise<string | null> | string | null;
}

export async function shelfView({ store, ledger, now, overdueLine }: ShelfViewDeps): Promise<ShelfView> {
  const lifetimePence = await ledger.lifetime();
  return {
    pacePence: paceToYearEnd(await ledger.presses(), now),
    lifetimePence,
    compoundedPence: compound(lifetimePence, COMPOUND_RATE, COMPOUND_YEARS),
    items: shelfState(await shelfItems(store), lifetimePence),
    goals: shelfState(await store.goals.list(), lifetimePence),
    overdueLine: await overdueLine(now),
  };
}

export async function setShelfPrice(store: Store, id: string, pricePence: number): Promise<void> {
  const settings = await store.getSettings();
  await store.putSettings({ ...settings, shelfPrices: { ...settings.shelfPrices, [id]: pricePence } });
}
