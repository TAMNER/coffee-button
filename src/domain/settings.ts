import type { Collection, Goal,Item, Press, Settings, Settlement, Store } from "./store";

export async function addItem(
  store: Store,
  name: string,
  pricePence: number,
  icon = "cup",
  newId: () => string = () => crypto.randomUUID(),
): Promise<Item> {
  const item: Item = { id: newId(), name, icon, pricePence };
  await store.items.put(item);
  return item;
}

async function updateItem(store: Store, id: string, change: Partial<Omit<Item, "id">>): Promise<void> {
  const item = await store.items.get(id);
  if (!item) throw new Error(`Unknown item: ${id}`);
  await store.items.put({ ...item, ...change });
}

export function renameItem(store: Store, id: string, name: string): Promise<void> {
  return updateItem(store, id, { name });
}

export function repriceItem(store: Store, id: string, pricePence: number): Promise<void> {
  return updateItem(store, id, { pricePence });
}

/** Payday must exist in every month, so 1 to 28. */
export function validatePayday(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 28;
}

export const EXPORT_VERSION = 1;

export interface ExportFile {
  version: typeof EXPORT_VERSION;
  items: Item[];
  presses: Press[];
  settlements: Settlement[];
  settings: Settings;
  goals: Goal[];
}

export async function exportData(store: Store): Promise<string> {
  const data: ExportFile = {
    version: EXPORT_VERSION,
    items: await store.items.list(),
    presses: await store.presses.list(),
    settlements: await store.settlements.list(),
    settings: await store.getSettings(),
    goals: await store.goals.list(),
  };
  return JSON.stringify(data, null, 2);
}

const NOT_EXPORT = "This file is not a Coffee Button export";

/** Parses and checks the whole file before anything is written. */
function parseExport(json: string): ExportFile {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error(`${NOT_EXPORT} (not JSON)`);
  }
  return data as ExportFile;
}

export async function importData(store: Store, json: string): Promise<void> {
  const data = parseExport(json);
  await replaceAll(store.items, data.items);
  await replaceAll(store.presses, data.presses);
  await replaceAll(store.settlements, data.settlements);
  await replaceAll(store.goals, data.goals);
  await store.putSettings(data.settings);
}

async function replaceAll<T extends { id: string }>(collection: Collection<T>, rows: T[]): Promise<void> {
  for (const old of await collection.list()) await collection.delete(old.id);
  for (const row of rows) await collection.put(row);
}

export async function setPayday(store: Store, day: number): Promise<void> {
  if (!validatePayday(day)) throw new Error(`Payday must be a whole day from 1 to 28, got ${day}`);
  await store.putSettings({ ...(await store.getSettings()), paydayDay: day });
}
