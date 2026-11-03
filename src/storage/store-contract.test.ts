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
  it("a fresh store holds one item, Coffee at 350 pence", async () => {
    const store = await backend.open(freshName());
    const items = await store.items.list();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: "Coffee", pricePence: 350 });
  });

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

  it("replaceAll swaps every collection and the settings for the given snapshot", async () => {
    const store = await backend.open(freshName());
    await store.presses.put(pressA);
    const snapshot = {
      items: [beer],
      presses: [pressB],
      settlements: [{ id: "s1", amountPence: 600, at: Date.UTC(2026, 10, 26, 9, 0) }],
      goals: [{ id: "g1", name: "Tent", pricePence: 20000 }],
      settings: { paydayDay: 20 },
    };

    await store.replaceAll(snapshot);

    expect(await store.items.list()).toEqual([beer]);
    expect(await store.presses.list()).toEqual([pressB]);
    expect(await store.settlements.list()).toEqual(snapshot.settlements);
    expect(await store.goals.list()).toEqual(snapshot.goals);
    expect(await store.getSettings()).toEqual({ paydayDay: 20 });
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
