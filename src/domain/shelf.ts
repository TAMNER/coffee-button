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

export function shelfState<T extends ShelfItem>(items: T[], lifetimePence: number): (T & ShelfEntry)[] {
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

/** What a new install's plank starts with (ticket 30). */
export const STARTER_TARGET_IDS: readonly string[] = ["weekend-away", "laptop", "ski-week"];

/**
 * Anything the app only writes once someone has used it: a phone with any of
 * these was in use before ticket 30. A new install has none at its first launch.
 */
async function usedBefore(store: Store): Promise<boolean> {
  const settings = await store.getSettings();
  return (
    settings.infoSeen === true ||
    Object.keys(settings.shelfPrices ?? {}).length > 0 ||
    (await store.goals.list()).length > 0 ||
    (await store.presses.list()).length > 0 ||
    (await store.settlements.list()).length > 0
  );
}

/**
 * Run at launch, before anything else writes (main.ts). `shelfBuiltInIds`
 * present: already settled, nothing to do. Absent on a phone used before:
 * migrateTargets. Absent on a new install: the starter three.
 */
export async function ensureTargets(store: Store): Promise<void> {
  const settings = await store.getSettings();
  if (settings.shelfBuiltInIds) return;
  if (await usedBefore(store)) return migrateTargets(store);
  await store.putSettings({ ...settings, shelfBuiltInIds: [...STARTER_TARGET_IDS] });
}

/** A phone from before ticket 30: every goal stays, the cheapest built-ins (edited prices) fill the places left. */
export async function migrateTargets(store: Store): Promise<void> {
  const settings = await store.getSettings();
  if (settings.shelfBuiltInIds) return; // already migrated: runs once
  const places =Math.max(0, MAX_TARGETS - (await store.goals.list()).length);
  const builtIns = (await shelfItems(store)).sort(cheapestFirst).slice(0, places);
  await store.putSettings({ ...settings, shelfBuiltInIds: builtIns.map((item) => item.id) });
}

/** The plank holds at most three targets, built-in and typed together. */
export const MAX_TARGETS = 3;

/** Superseded by MAX_TARGETS (ticket 30): goals and built-ins now share the three places. */
export const MAX_GOALS = 3;

/** Adds a typed target (a personal goal); throws once the plank holds MAX_TARGETS, built-ins included. */
export async function addGoal(
  store: Store,
  name: string,
  pricePence: number,
  newId: () => string = () => crypto.randomUUID(),
): Promise<Goal> {
  if ((await shelfTargets(store)).length >= MAX_TARGETS) {
    throw new Error(`At most ${MAX_TARGETS} targets`);
  }
  const goal: Goal = { id: newId(), name, pricePence };
  await store.goals.put(goal);
  return goal;
}

/** Superseded by removeTarget (ticket 30), which removes built-ins too. */
export function removeGoal(store: Store, id: string): Promise<void> {
  return store.goals.delete(id);
}

/** Takes any target off the plank, built-in or typed; it stays off (ticket 31's chips can put a built-in back). */
export async function removeTarget(store: Store, id: string): Promise<void> {
  await store.goals.delete(id);
  const settings = await store.getSettings();
  const ids = settings.shelfBuiltInIds ?? [];
  await store.putSettings({ ...settings, shelfBuiltInIds: ids.filter((builtIn) => builtIn !== id) });
}

/**
 * Ticket 31: the built-ins not on the plank, cheapest first at their current
 * prices; each shows as a chip. None while the plank is full (they hide with the form).
 */
export async function starterChips(store: Store): Promise<ShelfItem[]> {
  if ((await shelfTargets(store)).length >= MAX_TARGETS) return [];
  const ids = await plankBuiltInIds(store);
  return (await shelfItems(store)).filter((item) => !ids.includes(item.id)).sort(cheapestFirst);
}

/** Ticket 31: a tapped chip puts that built-in back on the plank, at its remembered or default price. */
export async function addStarter(store: Store, id: string): Promise<void> {
  const settings = await store.getSettings();
  await store.putSettings({ ...settings, shelfBuiltInIds: [...(settings.shelfBuiltInIds ?? []), id] });
}

export const COMPOUND_RATE = 0.05;
export const COMPOUND_YEARS = 10;

/** Everything the shelf screen shows, ready to render. */
export interface ShelfView {
  pacePence: number;
  lifetimePence: number;
  /** Lifetime total compounded at COMPOUND_RATE for COMPOUND_YEARS. */
  compoundedPence: number;
  /** The plank (ticket 30): at most MAX_TARGETS, cheapest first, lit and progress from the lifetime total. */
  targets: (ShelfTarget & ShelfEntry)[];
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
    targets: shelfState(await shelfTargets(store), lifetimePence),
    overdueLine: await overdueLine(now),
  };
}

export async function setShelfPrice(store: Store, id: string, pricePence: number): Promise<void> {
  const settings = await store.getSettings();
  await store.putSettings({ ...settings, shelfPrices: { ...settings.shelfPrices, [id]: pricePence } });
}
