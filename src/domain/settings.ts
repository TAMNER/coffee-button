import { listItems } from "./items";
import { DEFAULT_ITEM, DEFAULT_ITEMS, type Goal, type Item, type Press, type Settings, type Settlement, type Store } from "./store";

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

/** Takes an item out of the swipe for good (ticket 26). Coffee is permanent. Presses keep their own price, so totals stay. */
export async function removeItem(store: Store, id: string): Promise<void> {
  if (id === DEFAULT_ITEM.id) throw new Error("Coffee cannot be removed");
  await store.items.delete(id);
  if (!DEFAULT_ITEMS.some((item) => item.id === id)) return;
  const settings = await store.getSettings();
  const removed = settings.removedItemIds ?? [];
  if (!removed.includes(id)) await store.putSettings({ ...settings, removedItemIds: [...removed, id] });
}

/** Payday must exist in every month, so 1 to 28. */
export function validatePayday(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 28;
}

/** The normalised link when `text` is an http or https URL, otherwise null. */
export function validateInvestUrl(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
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
  // The Starling link (token and Space) stays on this phone (ticket 19).
  // So does a token rejection flag (ticket 20).
  const { starling: _phoneOnly, starlingAuthFailed: _alsoPhoneOnly, ...settings } = await store.getSettings();
  const data: ExportFile = {
    version: EXPORT_VERSION,
    items: await store.items.list(),
    presses: await store.presses.list(),
    settlements: await store.settlements.list(),
    settings,
    goals: await store.goals.list(),
  };
  return JSON.stringify(data, null, 2);
}

type Row = Record<string, unknown>;

/** The fields every row must carry, and their types. */
const ROW_FIELDS: Record<"items" | "presses" | "settlements" | "goals", Record<string, "string" | "number">> = {
  items: { id: "string", name: "string", icon: "string", pricePence: "number" },
  presses: { id: "string", itemId: "string", pricePence: "number", at: "number" },
  settlements: { id: "string", amountPence: "number", at: "number" },
  goals: { id: "string", name: "string", pricePence: "number" },
};

function isRow(row: unknown, fields: Record<string, "string" | "number">): boolean {
  if (typeof row !== "object" || row === null) return false;
  return Object.entries(fields).every(([name, type]) => {
    const value = (row as Row)[name];
    return type === "number" ? typeof value === "number" && Number.isFinite(value) : typeof value === "string";
  });
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
  const file = data as Record<string, unknown>;
  if (file?.version !== EXPORT_VERSION) {
    throw new Error(`${NOT_EXPORT} (unsupported version ${String(file?.version)}; expected ${EXPORT_VERSION})`);
  }
  for (const [key, fields] of Object.entries(ROW_FIELDS)) {
    const rows = file[key];
    if (!Array.isArray(rows)) throw new Error(`${NOT_EXPORT} (${key} must be a list)`);
    rows.forEach((row: unknown, i) => {
      if (!isRow(row, fields)) throw new Error(`${NOT_EXPORT} (${key} entry ${i + 1} is not valid)`);
    });
  }
  if (!(file.items as Item[]).some((item) => item.id === DEFAULT_ITEM.id)) {
    throw new Error(`${NOT_EXPORT} (it has no Coffee item)`);
  }
  const settings = file.settings as Partial<Settings> | undefined;
  if (!validatePayday(Number(settings?.paydayDay))) {
    throw new Error(`${NOT_EXPORT} (payday must be 1 to 28)`);
  }
  if (settings?.activeItemId !== undefined && typeof settings.activeItemId !== "string") {
    throw new Error(`${NOT_EXPORT} (active item must be an item id)`);
  }
  const removed: unknown = settings?.removedItemIds;
  if (removed !== undefined && !(Array.isArray(removed) && removed.every((id) => typeof id === "string"))) {
    throw new Error(`${NOT_EXPORT} (removed items must be a list of item ids)`);
  }
  const investUrl: unknown = settings?.investUrl;
  if (investUrl !== undefined && (typeof investUrl !== "string" || validateInvestUrl(investUrl) === null)) {
    throw new Error(`${NOT_EXPORT} (where you invest must be an http or https link)`);
  }
  return data as ExportFile;
}

export async function importData(store: Store, json: string): Promise<void> {
  const { items, presses, settlements, goals, settings: fileSettings } = parseExport(json);
  // A file never brings a Starling link; this phone keeps the one it has (ticket 19).
  const { starling: _ignored, starlingAuthFailed: _alsoIgnored, ...fromFile } = fileSettings;
  const { starling, starlingAuthFailed } = await store.getSettings();
  const settings = {
    ...fromFile,
    ...(starling ? { starling } : {}),
    ...(starlingAuthFailed ? { starlingAuthFailed } : {}),
  };
  await store.replaceAll({ items, presses, settlements, goals, settings });
}

export async function setPayday(store: Store, day: number): Promise<void> {
  if (!validatePayday(day)) throw new Error(`Payday must be a whole day from 1 to 28, got ${day}`);
  await store.putSettings({ ...(await store.getSettings()), paydayDay: day });
}

/** Saves where "Invest £X" goes; blank clears it (copy only); anything not http(s) is refused. */
export async function setInvestUrl(store: Store, text: string): Promise<void> {
  const { investUrl: _old, ...settings } = await store.getSettings();
  if (text.trim() === "") return store.putSettings(settings);
  const url = validateInvestUrl(text);
  if (url === null) throw new Error(`Where you invest must be an http or https link, got ${text}`);
  await store.putSettings({ ...settings, investUrl: url });
}

/** The item a tap on the cup records: the stored choice while it exists, else the first item in cycling order. */
export async function activeItemId(store: Store): Promise<string> {
  const chosen = (await store.getSettings()).activeItemId;
  const items = await listItems(store);
  return items.find((item) => item.id === chosen)?.id ?? items[0].id;
}

export async function setActiveItem(store: Store, id: string): Promise<void> {
  await store.putSettings({ ...(await store.getSettings()), activeItemId: id });
}
