import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  DEFAULT_ITEM,
  DEFAULT_SETTINGS,
  type Collection,
  type Goal,
  type Item,
  type Press,
  type Settings,
  type Settlement,
  type Store,
} from "../domain/store";

type Row = { id: string };

interface CoffeeDb extends DBSchema {
  items: { key: string; value: Item };
  presses: { key: string; value: Press };
  settlements: { key: string; value: Settlement };
  goals: { key: string; value: Goal };
  settings: { key: string; value: Settings };
}

type CollectionName = "items" | "presses" | "settlements" | "goals";

const SETTINGS_KEY = "settings";

class IdbCollection<T extends Row> implements Collection<T> {
  constructor(
    private db: IDBPDatabase<CoffeeDb>,
    private name: CollectionName,
  ) {}

  async get(id: string): Promise<T | undefined> {
    return (await this.db.get(this.name, id)) as unknown as T | undefined;
  }

  async put(value: T): Promise<void> {
    await this.db.put(this.name, value as never);
  }

  async list(): Promise<T[]> {
    return (await this.db.getAll(this.name)) as unknown as T[];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(this.name, id);
  }
}

export class IndexedDbStore implements Store {
  items: Collection<Item>;
  presses: Collection<Press>;
  settlements: Collection<Settlement>;
  goals: Collection<Goal>;

  private constructor(private db: IDBPDatabase<CoffeeDb>) {
    this.items = new IdbCollection<Item>(db, "items");
    this.presses = new IdbCollection<Press>(db, "presses");
    this.settlements = new IdbCollection<Settlement>(db, "settlements");
    this.goals = new IdbCollection<Goal>(db, "goals");
  }

  static async open(name = "coffee-button"): Promise<IndexedDbStore> {
    const db = await openDB<CoffeeDb>(name, 1, {
      upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion >= 1) return;
        db.createObjectStore("items", { keyPath: "id" });
        db.createObjectStore("presses", { keyPath: "id" });
        db.createObjectStore("settlements", { keyPath: "id" });
        db.createObjectStore("goals", { keyPath: "id" });
        db.createObjectStore("settings");
        void tx.objectStore("items").put(DEFAULT_ITEM);
      },
    });
    return new IndexedDbStore(db);
  }

  async getSettings(): Promise<Settings> {
    return (await this.db.get("settings", SETTINGS_KEY)) ?? { ...DEFAULT_SETTINGS };
  }

  async putSettings(settings: Settings): Promise<void> {
    await this.db.put("settings", settings, SETTINGS_KEY);
  }
}
