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
  type Snapshot,
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

type Run = <R>(fn: (db: IDBPDatabase<CoffeeDb>) => Promise<R>) => Promise<R>;

class IdbCollection<T extends Row> implements Collection<T> {
  constructor(
    private run: Run,
    private name: CollectionName,
  ) {}

  async get(id: string): Promise<T | undefined> {
    return (await this.run((db) => db.get(this.name, id))) as unknown as T | undefined;
  }

  async put(value: T): Promise<void> {
    await this.run((db) => db.put(this.name, value as never));
  }

  async list(): Promise<T[]> {
    return (await this.run((db) => db.getAll(this.name))) as unknown as T[];
  }

  async delete(id: string): Promise<void> {
    await this.run((db) => db.delete(this.name, id));
  }
}

function connect(name: string, onLost: () => void): Promise<IDBPDatabase<CoffeeDb>> {
  return openDB<CoffeeDb>(name, 1, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion >= 1) return;
      db.createObjectStore("items", { keyPath: "id" });
      db.createObjectStore("presses", { keyPath: "id" });
      db.createObjectStore("settlements", { keyPath: "id" });
      db.createObjectStore("goals", { keyPath: "id" });
      db.createObjectStore("settings");
      void tx.objectStore("items").put(DEFAULT_ITEM);
    },
    // WebKit drops connections of backgrounded apps ("Connection to Indexed
    // Database server lost"); a later version upgrade asks us to step aside.
    terminated: onLost,
    blocking(_current, _next, event) {
      (event.target as IDBDatabase).close();
      onLost();
    },
  });
}

/**
 * IndexedDB-backed store. The connection is reopened lazily when it is lost,
 * and any call that fails with InvalidStateError (a closed connection) is
 * retried once on a fresh connection.
 */
export class IndexedDbStore implements Store {
  items: Collection<Item>;
  presses: Collection<Press>;
  settlements: Collection<Settlement>;
  goals: Collection<Goal>;
  private lost = false;

  private constructor(
    private db: IDBPDatabase<CoffeeDb>,
    private name: string,
  ) {
    const run: Run = (fn) => this.run(fn);
    this.items = new IdbCollection<Item>(run, "items");
    this.presses = new IdbCollection<Press>(run, "presses");
    this.settlements = new IdbCollection<Settlement>(run, "settlements");
    this.goals = new IdbCollection<Goal>(run, "goals");
  }

  static async open(name = "coffee-button"): Promise<IndexedDbStore> {
    let store: IndexedDbStore | undefined;
    const db = await connect(name, () => store?.markLost());
    store = new IndexedDbStore(db, name);
    return store;
  }

  /** Closes the connection underneath the store, as WebKit does to a backgrounded app. */
  dropConnectionForTest(): void {
    this.db.close();
  }

  private markLost(): void {
    this.lost = true;
  }

  private async reconnect(): Promise<IDBPDatabase<CoffeeDb>> {
    this.lost = false;
    this.db = await connect(this.name, () => this.markLost());
    return this.db;
  }

  private async run<R>(fn: (db: IDBPDatabase<CoffeeDb>) => Promise<R>): Promise<R> {
    const db = this.lost ? await this.reconnect() : this.db;
    try {
      return await fn(db);
    } catch (err) {
      if ((err as { name?: string })?.name !== "InvalidStateError") throw err;
      return fn(await this.reconnect());
    }
  }

  async getSettings(): Promise<Settings> {
    return (await this.run((db) => db.get("settings", SETTINGS_KEY))) ?? { ...DEFAULT_SETTINGS };
  }

  async putSettings(settings: Settings): Promise<void> {
    await this.run((db) => db.put("settings", settings, SETTINGS_KEY));
  }

  /** One readwrite transaction over every object store: any failure aborts it all. */
  replaceAll(snapshot: Snapshot): Promise<void> {
    return this.run((db) => this.replaceAllOn(db, snapshot));
  }

  private async replaceAllOn(db: IDBPDatabase<CoffeeDb>, snapshot: Snapshot): Promise<void> {
    const tx = db.transaction(["items", "presses", "settlements", "goals", "settings"], "readwrite");
    // A row with no key makes put() throw synchronously, before any promise exists,
    // so everything sits inside the try and the catch aborts the transaction.
    try {
      // tx.done rejects if any request fails; each request's own promise is
      // marked handled so an aborted request is not an unhandled rejection.
      const quiet = (p: Promise<unknown>) => void p.catch(() => {});
      for (const name of ["items", "presses", "settlements", "goals"] as const) {
        const os = tx.objectStore(name);
        quiet(os.clear());
        for (const row of snapshot[name]) quiet(os.put(row as never));
      }
      quiet(tx.objectStore("settings").put(snapshot.settings, SETTINGS_KEY));
      await tx.done;
    } catch (err) {
      try {
        tx.abort();
      } catch {
        // already aborted
      }
      await tx.done.catch(() => {});
      throw err;
    }
  }
}
