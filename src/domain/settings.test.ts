import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
import { addItem, exportData, importData, renameItem, repriceItem, setPayday, validatePayday } from "./settings";
import { MemoryStore } from "./store";

describe("settings: items", () => {
  it("addItem('Beer', 600) lists Coffee at £3.50 and Beer at £6.00", async () => {
    const store = new MemoryStore();

    await addItem(store, "Beer", 600, "pint", () => "beer-1");

    const items = await store.items.list();
    expect(items).toEqual([
      { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 },
      { id: "beer-1", name: "Beer", icon: "pint", pricePence: 600 },
    ]);
  });

  it("repricing Coffee to 380 and renaming Beer to Pint change only those items; an earlier Coffee press stays at 350", async () => {
    const store = new MemoryStore();
    await addItem(store, "Beer", 600, "pint", () => "beer-1");
    const ledger = new Ledger(store, () => "press-1");
    await ledger.addPress("coffee", new Date(2026, 10, 3, 9, 0));

    await repriceItem(store, "coffee", 380);
    await renameItem(store, "beer-1", "Pint");

    expect(await store.items.list()).toEqual([
      { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 380 },
      { id: "beer-1", name: "Pint", icon: "pint", pricePence: 600 },
    ]);
    expect(await store.presses.list()).toEqual([
      { id: "press-1", itemId: "coffee", pricePence: 350, at: new Date(2026, 10, 3, 9, 0).getTime() },
    ]);
  });
});

describe("settings: payday", () => {
  it("validatePayday accepts 1, 25 and 28 and rejects 0, 29, 31, 2.5 and NaN", () => {
    expect([1, 25, 28].map((n) => validatePayday(n))).toEqual([true, true, true]);
    expect([0, 29, 31, 2.5, NaN].map((n) => validatePayday(n))).toEqual([false, false, false, false, false]);
  });

  it("a fresh store's payday is 25; setPayday stores 1 and refuses 29 without changing it", async () => {
    const store = new MemoryStore();
    expect((await store.getSettings()).paydayDay).toBe(25);

    await setPayday(store, 1);
    await expect(setPayday(store, 29)).rejects.toThrow(/1 to 28/);

    expect((await store.getSettings()).paydayDay).toBe(1);
  });
});

/** The demo from the ticket: Beer at £6, Coffee at £3.80, a press of each, one settlement, a goal, payday 20. */
const FIXTURE = {
  version: 1,
  items: [
    { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 380 },
    { id: "beer", name: "Beer", icon: "pint", pricePence: 600 },
  ],
  presses: [
    { id: "p1", itemId: "coffee", pricePence: 350, at: 1790000000000 },
    { id: "p2", itemId: "beer", pricePence: 600, at: 1790003600000 },
  ],
  settlements: [{ id: "s1", amountPence: 950, at: 1790100000000 }],
  settings: { paydayDay: 20 },
  goals: [{ id: "g1", name: "Ski week", pricePence: 120000 }],
};

async function storeWithFixture(): Promise<MemoryStore> {
  const store = new MemoryStore();
  for (const item of FIXTURE.items) await store.items.put(item);
  for (const press of FIXTURE.presses) await store.presses.put(press);
  for (const settlement of FIXTURE.settlements) await store.settlements.put(settlement);
  for (const goal of FIXTURE.goals) await store.goals.put(goal);
  await store.putSettings(FIXTURE.settings);
  return store;
}

describe("settings: export and import", () => {
  it("exportData writes version 1 with every press, item, settlement, setting and goal", async () => {
    const store = await storeWithFixture();

    const json = await exportData(store);

    expect(JSON.parse(json)).toEqual(FIXTURE);
  });

  it("importData of the fixture into a fresh store restores it exactly", async () => {
    const store = new MemoryStore();

    await importData(store, JSON.stringify(FIXTURE));

    expect(await store.items.list()).toEqual(FIXTURE.items);
    expect(await store.presses.list()).toEqual(FIXTURE.presses);
    expect(await store.settlements.list()).toEqual(FIXTURE.settlements);
    expect(await store.goals.list()).toEqual(FIXTURE.goals);
    expect(await store.getSettings()).toEqual({ paydayDay: 20 });
  });

  it("importData replaces what was there: a stale press and an extra item are gone afterwards", async () => {
    const store = new MemoryStore();
    await store.items.put({ id: "tea", name: "Tea", icon: "mug", pricePence: 200 });
    await store.presses.put({ id: "stale", itemId: "tea", pricePence: 200, at: 1780000000000 });

    await importData(store, JSON.stringify(FIXTURE));

    expect((await store.items.list()).map((i) => i.id)).toEqual(["coffee", "beer"]);
    expect((await store.presses.list()).map((p) => p.id)).toEqual(["p1", "p2"]);
  });
});

describe("settings: malformed import", () => {
  it("text that is not JSON is rejected with 'not a Coffee Button export' and the store is untouched", async () => {
    const store = await storeWithFixture();

    await expect(importData(store, "hello {")).rejects.toThrow("This file is not a Coffee Button export (not JSON)");

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });
});
