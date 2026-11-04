import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { listItems } from "../domain/items";
import { exportData, importData } from "../domain/settings";
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
  it("a fresh store holds Coffee at 350, Beer at 600, then Lunch at 800, in that order", async () => {
    const store = await backend.open(freshName());

    expect(await listItems(store)).toEqual([
      { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 },
      { id: "beer", name: "Beer", icon: "beer", pricePence: 600 },
      { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 },
    ]);
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

  it("replaceAll with a press that has no id fails and leaves every collection as it was", async () => {
    const store = await backend.open(freshName());
    await store.items.put(beer);
    await store.presses.put(pressA);
    const itemsBefore = await store.items.list();
    const badPress = { itemId: "beer", pricePence: 600, at: pressB.at } as unknown as typeof pressB;

    await expect(
      store.replaceAll({ items: [], presses: [badPress], settlements: [], goals: [], settings: { paydayDay: 20 } }),
    ).rejects.toThrow();

    expect(await store.items.list()).toEqual(itemsBefore);
    expect(await store.presses.list()).toEqual([pressA]);
    expect((await store.getSettings()).paydayDay).toBe(25);
  });

  it("puts, gets, lists and deletes settlements and goals", async () => {
    const store = await backend.open(freshName());
    const s1 = { id: "s1", amountPence: 1250, at: Date.UTC(2026, 9, 26, 9, 0) };
    const s2 = { id: "s2", amountPence: 2400, at: Date.UTC(2026, 10, 26, 9, 0) };
    const tent = { id: "g1", name: "Tent", pricePence: 20000 };
    await store.settlements.put(s1);
    await store.settlements.put(s2);
    await store.settlements.delete("s1");
    await store.goals.put(tent);

    expect(await store.settlements.get("s2")).toEqual(s2);
    expect(await store.settlements.list()).toEqual([s2]);
    expect(await store.goals.list()).toEqual([tent]);
  });

  it("settings default to payday 25 when nothing is stored, and putSettings round-trips every field", async () => {
    const store = await backend.open(freshName());
    expect(await store.getSettings()).toEqual({ paydayDay: 25 });

    const settings = {
      paydayDay: 20,
      shelfPrices: { laptop: 120000 },
      overdueShownAt: Date.UTC(2026, 10, 3, 12, 0),
      pendingInvest: { amountPence: 1250, startedAt: Date.UTC(2026, 10, 26, 9, 0) },
      activeItemId: "beer",
    };
    await store.putSettings(settings);

    expect(await store.getSettings()).toEqual(settings);
  });

  it("the Starling link (ticket 19) is kept in settings and, where persistent, survives reopening", async () => {
    const name = freshName();
    const store = await backend.open(name);
    const starling = {
      token: "tok-1",
      relayUrl: "https://relay.example:8443",
      accountUid: "acc-1",
      spaceUid: "sg-1",
      spaceName: "Coffee Button",
    };
    await store.putSettings({ paydayDay: 25, starling });

    const reread = backend.persistent ? await backend.open(name) : store;
    expect((await reread.getSettings()).starling).toEqual(starling);
  });

  it("an export imported into a second fresh store gives back the same export", async () => {
    const source = await backend.open(freshName());
    await source.items.put(beer);
    await source.presses.put(pressA);
    await source.settlements.put({ id: "s1", amountPence: 600, at: Date.UTC(2026, 10, 26, 9, 0) });
    await source.goals.put({ id: "g1", name: "Tent", pricePence: 20000 });
    await source.putSettings({ paydayDay: 20 });
    const json = await exportData(source);

    const target = await backend.open(freshName());
    await importData(target, json);

    expect(await exportData(target)).toBe(json);
  });

  it.runIf(backend.persistent)("a new store instance on the same database name sees earlier writes", async () => {
    const dbName = freshName();
    const first = await backend.open(dbName);
    await first.items.put(beer);
    await first.presses.put(pressA);

    await first.settlements.put({ id: "s1", amountPence: 600, at: pressB.at });
    await first.putSettings({ paydayDay: 20 });

    const second = await backend.open(dbName);
    expect(await second.items.get("beer")).toEqual(beer);
    expect(await second.presses.list()).toEqual([pressA]);
    expect(await second.settlements.list()).toEqual([{ id: "s1", amountPence: 600, at: pressB.at }]);
    expect(await second.getSettings()).toEqual({ paydayDay: 20 });
  });
});

describe("IndexedDbStore after WebKit drops the connection (app backgrounded)", () => {
  it("reopens and retries: a press put after the connection closed is stored and readable", async () => {
    const dbName = freshName();
    const store = await IndexedDbStore.open(dbName);
    store.dropConnectionForTest();

    await store.presses.put(pressA);

    expect(await store.presses.list()).toEqual([pressA]);
    const other = await IndexedDbStore.open(dbName);
    expect(await other.presses.get("p1")).toEqual(pressA);
  });
});
