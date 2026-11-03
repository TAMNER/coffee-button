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
}

export const DEFAULT_SETTINGS: Settings = { paydayDay: 25 };

export interface Collection<T extends { id: string }> {
  get(id: string): Promise<T | undefined>;
  put(value: T): Promise<void>;
  list(): Promise<T[]>;
  delete(id: string): Promise<void>;
}

export interface Store {
  items: Collection<Item>;
  presses: Collection<Press>;
  settlements: Collection<Settlement>;
  goals: Collection<Goal>;
  getSettings(): Promise<Settings>;
  putSettings(settings: Settings): Promise<void>;
}

class MemoryCollection<T extends { id: string }> implements Collection<T> {
  private rows = new Map<string, T>();

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
  items: Collection<Item> = new MemoryCollection<Item>();
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
}
