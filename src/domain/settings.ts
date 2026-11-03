import type { Goal, Item, Press, Settings, Settlement, Store } from "./store";

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

export async function importData(store: Store, json: string): Promise<void> {
  const data = JSON.parse(json) as ExportFile;
  for (const item of data.items) await store.items.put(item);
  for (const press of data.presses) await store.presses.put(press);
  for (const settlement of data.settlements) await store.settlements.put(settlement);
  for (const goal of data.goals) await store.goals.put(goal);
  await store.putSettings(data.settings);
}

export async function setPayday(store: Store, day: number): Promise<void> {
  if (!validatePayday(day)) throw new Error(`Payday must be a whole day from 1 to 28, got ${day}`);
  await store.putSettings({ ...(await store.getSettings()), paydayDay: day });
}
