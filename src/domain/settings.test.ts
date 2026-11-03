import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
import { addItem, renameItem, repriceItem, setPayday, validatePayday } from "./settings";
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
