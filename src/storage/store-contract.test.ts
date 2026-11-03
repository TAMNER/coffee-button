import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { MemoryStore, type Store } from "../domain/store";
import { IndexedDbStore } from "./idb";

interface Backend {
  name: string;
  open(dbName: string): Promise<Store>;
  /** True when a second store opened on the same name sees the first one's data. */
  persistent: boolean;
}

const backends: Backend[] = [
  { name: "MemoryStore", open: async () => new MemoryStore(), persistent: false },
  { name: "IndexedDbStore", open: (dbName) => IndexedDbStore.open(dbName), persistent: true },
];

let counter = 0;
const freshName = () => `contract-${Date.now()}-${counter++}`;

const beer = { id: "beer", name: "Beer", icon: "pint", pricePence: 600 };
const pressA = { id: "p1", itemId: "beer", pricePence: 600, at: Date.UTC(2026, 10, 3, 18, 0) };
const pressB = { id: "p2", itemId: "beer", pricePence: 600, at: Date.UTC(2026, 10, 4, 18, 0) };

describe.each(backends)("Store contract: $name", (backend) => {
  it("puts, gets and lists items and presses; delete removes one", async () => {
    const store = await backend.open(freshName());
    await store.items.put(beer);
    await store.presses.put(pressA);
    await store.presses.put(pressB);
    await store.presses.delete("p1");

    expect(await store.items.get("beer")).toEqual(beer);
    expect((await store.items.list()).find((i) => i.id === "beer")).toEqual(beer);
    expect(await store.presses.get("p1")).toBeUndefined();
    expect(await store.presses.list()).toEqual([pressB]);
  });

  it.runIf(backend.persistent)("a new store instance on the same database name sees earlier writes", async () => {
    const dbName = freshName();
    const first = await backend.open(dbName);
    await first.items.put(beer);
    await first.presses.put(pressA);

    const second = await backend.open(dbName);
    expect(await second.items.get("beer")).toEqual(beer);
    expect(await second.presses.list()).toEqual([pressA]);
  });
});
