export interface Item {
  id: string;
  name: string;
  icon: string;
  pricePence: number;
}

export interface Press {
  id: string;
  itemId: string;
  /** Item price captured when the press happened. */
  pricePence: number;
  /** Epoch milliseconds. */
  at: number;
  /** The Starling Space transfer for this press (ticket 20); absent means no mover was linked at press time. */
  transfer?: PressTransfer;
}

export interface PressTransfer {
  state: "waiting" | "moved" | "failed";
  /** Created once per press and reused on every retry, so Starling moves the money at most once. */
  transferUid: string;
  attempts?: number;
  lastError?: string;
}

export interface Settlement {
  id: string;
  amountPence: number;
  /** Epoch milliseconds. */
  at: number;
}

export interface Goal {
  id: string;
  name: string;
  pricePence: number;
}

export interface Settings {
  /** Day of month the author is paid; settle day is the day after. */
  paydayDay: number;
  /** Shelf item id to user-edited price; absent ids use the default price. */
  shelfPrices?: Record<string, number>;
  /** Epoch ms the shelf last showed the owed-since reminder; it shows at most weekly. */
  overdueShownAt?: number;
  /** The item a tap on the cup records; absent means the first item (Coffee). */
  activeItemId?: string;
  /** An Invest tap not yet answered, kept so the question survives the app being killed. */
  pendingInvest?: PendingInvest;
  /** True once the info sheet has been shown, so it opens by itself only on the first ever launch. */
  infoSeen?: boolean;
  /** Where "Invest £X" sends the user (http or https); absent or blank means copy only. */
  investUrl?: string;
  /** The linked Starling Space (ticket 19). On this phone only: export omits it, import ignores it. */
  starling?: StarlingLink;
}

export interface StarlingLink {
  /** Starling Personal Access Token. Never logged, never exported. */
  token: string;
  relayUrl: string;
  accountUid: string;
  spaceUid: string;
  spaceName: string;
}

export interface PendingInvest {
  amountPence: number;
  /** Epoch ms of the Invest tap. */
  startedAt: number;
}

export const DEFAULT_SETTINGS: Settings = { paydayDay: 25 };

/** Seeded into every fresh store. Users may reprice it in settings. */
export const DEFAULT_ITEM: Item = { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 };
export const BEER_ITEM: Item = { id: "beer", name: "Beer", icon: "beer", pricePence: 600 };
export const LUNCH_ITEM: Item = { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 };
/** Every item a fresh store starts with, in the order the cup screen cycles them. */
export const DEFAULT_ITEMS: readonly Item[] = [DEFAULT_ITEM, BEER_ITEM, LUNCH_ITEM];

export interface Collection<T extends { id: string }> {
  get(id: string): Promise<T | undefined>;
  put(value: T): Promise<void>;
  list(): Promise<T[]>;
  delete(id: string): Promise<void>;
}

/** Everything the app stores, as import and export see it. */
export interface Snapshot {
  items: Item[];
  presses: Press[];
  settlements: Settlement[];
  goals: Goal[];
  settings: Settings;
}

export interface Store {
  items: Collection<Item>;
  presses: Collection<Press>;
  settlements: Collection<Settlement>;
  goals: Collection<Goal>;
  getSettings(): Promise<Settings>;
  putSettings(settings: Settings): Promise<void>;
  /** Replaces everything with `snapshot` all at once: on failure nothing changes. */
  replaceAll(snapshot: Snapshot): Promise<void>;
}

class MemoryCollection<T extends { id: string }> implements Collection<T> {
  private rows = new Map<string, T>();

  constructor(seed: T[] = []) {
    for (const row of seed) {
      // Same rule as IndexedDB's keyPath: every row needs a string id.
      if (typeof row?.id !== "string") throw new Error("Every row needs a string id");
      this.rows.set(row.id, structuredClone(row));
    }
  }

  async get(id: string): Promise<T | undefined> {
    const row = this.rows.get(id);
    return row && structuredClone(row);
  }

  async put(value: T): Promise<void> {
    this.rows.set(value.id, structuredClone(value));
  }

  async list(): Promise<T[]> {
    return [...this.rows.values()].map((row) => structuredClone(row));
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

export class MemoryStore implements Store {
  items: Collection<Item> = new MemoryCollection<Item>([...DEFAULT_ITEMS]);
  presses: Collection<Press> = new MemoryCollection<Press>();
  settlements: Collection<Settlement> = new MemoryCollection<Settlement>();
  goals: Collection<Goal> = new MemoryCollection<Goal>();
  private settings: Settings = { ...DEFAULT_SETTINGS };

  async getSettings(): Promise<Settings> {
    return structuredClone(this.settings);
  }

  async putSettings(settings: Settings): Promise<void> {
    this.settings = structuredClone(settings);
  }

  async replaceAll(snapshot: Snapshot): Promise<void> {
    // Built aside first, so a row that cannot be cloned leaves the store as it was.
    const next = {
      items: new MemoryCollection<Item>(snapshot.items),
      presses: new MemoryCollection<Press>(snapshot.presses),
      settlements: new MemoryCollection<Settlement>(snapshot.settlements),
      goals: new MemoryCollection<Goal>(snapshot.goals),
      settings: structuredClone(snapshot.settings),
    };
    this.items = next.items;
    this.presses = next.presses;
    this.settlements = next.settlements;
    this.goals = next.goals;
    this.settings = next.settings;
  }
}
