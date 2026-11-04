import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
import { activeItemId, addItem, setActiveItem, exportData, importData, renameItem, repriceItem, setInvestUrl, setPayday, validateInvestUrl, validatePayday } from "./settings";
import { MemoryStore } from "./store";

describe("settings: items", () => {
  it("addItem('Tea', 250) lists Coffee at £3.50, the seeded Beer at £6.00 and Tea at £2.50", async () => {
    const store = new MemoryStore();

    await addItem(store, "Tea", 250, "cup", () => "tea-1");

    const items = await store.items.list();
    expect(items).toEqual([
      { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 },
      { id: "beer", name: "Beer", icon: "beer", pricePence: 600 },
      { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 },
      { id: "tea-1", name: "Tea", icon: "cup", pricePence: 250 },
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
      { id: "beer", name: "Beer", icon: "beer", pricePence: 600 },
      { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 },
      { id: "beer-1", name: "Pint", icon: "pint", pricePence: 600 },
    ]);
    expect(await store.presses.list()).toEqual([
      { id: "press-1", itemId: "coffee", pricePence: 350, at: new Date(2026, 10, 3, 9, 0).getTime() },
    ]);
  });
});

describe("settings: active item", () => {
  it("defaults to the first item, Coffee", async () => {
    const store = new MemoryStore();

    expect(await activeItemId(store)).toBe("coffee");
  });

  it("setActiveItem('beer') is remembered and leaves payday 25 alone", async () => {
    const store = new MemoryStore();

    await setActiveItem(store, "beer");

    expect(await activeItemId(store)).toBe("beer");
    expect(await store.getSettings()).toEqual({ paydayDay: 25, activeItemId: "beer" });
  });

  it("falls back to Coffee when the remembered item no longer exists", async () => {
    const store = new MemoryStore();
    await setActiveItem(store, "beer");
    await store.items.delete("beer");

    expect(await activeItemId(store)).toBe("coffee");
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

describe("settings: invest destination", () => {
  it("validateInvestUrl keeps http and https links, normalised, and refuses anything else", () => {
    expect(validateInvestUrl("  https://Example.com/isa ")).toBe("https://example.com/isa");
    expect(validateInvestUrl("http://example.com")).toBe("http://example.com/");
    expect(validateInvestUrl("javascript:alert(1)")).toBeNull();
    expect(validateInvestUrl("ftp://example.com/")).toBeNull();
    expect(validateInvestUrl("example.com")).toBeNull();
    expect(validateInvestUrl("")).toBeNull();
  });

  it("setInvestUrl stores the normalised link, refuses ftp:// leaving it unchanged, and blank clears it", async () => {
    const store = new MemoryStore();

    await setInvestUrl(store, " https://Example.com/isa");
    expect(await store.getSettings()).toEqual({ paydayDay: 25, investUrl: "https://example.com/isa" });

    await expect(setInvestUrl(store, "ftp://example.com/")).rejects.toThrow("http");
    expect((await store.getSettings()).investUrl).toBe("https://example.com/isa");

    await setInvestUrl(store, "   ");
    expect(await store.getSettings()).toEqual({ paydayDay: 25 });
  });
});

/** The demo from the ticket: Beer at £6, Coffee at £3.80, a press of each, one settlement, a goal, payday 20. */
const FIXTURE = {
  version: 1,
  items: [
    { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 380 },
    { id: "beer", name: "Beer", icon: "pint", pricePence: 600 },
    { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 },
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

    expect((await store.items.list()).map((i) => i.id)).toEqual(["coffee", "beer", "lunch"]);
    expect((await store.presses.list()).map((p) => p.id)).toEqual(["p1", "p2"]);
  });
});

describe("settings: malformed import", () => {
  it("text that is not JSON is rejected with 'not a Coffee Button export' and the store is untouched", async () => {
    const store = await storeWithFixture();

    await expect(importData(store, "hello {")).rejects.toThrow("This file is not a Coffee Button export (not JSON)");

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });

  it("a file with version 2 is rejected naming the version and the store is untouched", async () => {
    const store = await storeWithFixture();
    const empty = { version: 2, items: [], presses: [], settlements: [], settings: { paydayDay: 25 }, goals: [] };

    await expect(importData(store, JSON.stringify(empty))).rejects.toThrow(
      "This file is not a Coffee Button export (unsupported version 2; expected 1)",
    );

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });

  it("a version 1 file whose presses is not an array is rejected naming 'presses' and the store is untouched", async () => {
    const store = await storeWithFixture();
    const broken = { version: 1, items: [], presses: "lots", settlements: [], settings: { paydayDay: 25 }, goals: [] };

    await expect(importData(store, JSON.stringify(broken))).rejects.toThrow(
      "This file is not a Coffee Button export (presses must be a list)",
    );

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });

  it("a version 1 file with payday 31 is rejected and the store is untouched", async () => {
    const store = await storeWithFixture();
    const broken = { ...FIXTURE, settings: { paydayDay: 31 } };

    await expect(importData(store, JSON.stringify(broken))).rejects.toThrow(
      "This file is not a Coffee Button export (payday must be 1 to 28)",
    );

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });

  it("a well-formed file whose presses list holds null is rejected and the store is untouched", async () => {
    const store = await storeWithFixture();
    const broken = { ...FIXTURE, items: [{ id: "x", name: "X", icon: "cup", pricePence: 100 }], presses: [null] };

    await expect(importData(store, JSON.stringify(broken))).rejects.toThrow("This file is not a Coffee Button export");

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });

  it("a file whose settlement has no amount or whose press has a text price is rejected and the store is untouched", async () => {
    const store = await storeWithFixture();
    const noAmount = { ...FIXTURE, settlements: [{ id: "s1", at: 1790100000000 }] };
    const textPrice = { ...FIXTURE, presses: [{ id: "p1", itemId: "coffee", pricePence: "350", at: 1790000000000 }] };

    await expect(importData(store, JSON.stringify(noAmount))).rejects.toThrow(
      "This file is not a Coffee Button export (settlements entry 1 is not valid)",
    );
    await expect(importData(store, JSON.stringify(textPrice))).rejects.toThrow(
      "This file is not a Coffee Button export (presses entry 1 is not valid)",
    );

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });

  it("a file whose items leave out Coffee is rejected, because the cup presses Coffee, and the store is untouched", async () => {
    const store = await storeWithFixture();
    const noCoffee = { ...FIXTURE, items: [{ id: "beer", name: "Beer", icon: "pint", pricePence: 600 }] };

    await expect(importData(store, JSON.stringify(noCoffee))).rejects.toThrow(
      "This file is not a Coffee Button export (it has no Coffee item)",
    );

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });

  it("export then import round-trips the active item: Beer stays active", async () => {
    const source = await storeWithFixture();
    await setActiveItem(source, "beer");
    const json = await exportData(source);

    const target = new MemoryStore();
    await importData(target, json);

    expect(JSON.parse(json).settings).toEqual({ paydayDay: 20, activeItemId: "beer" });
    expect(await activeItemId(target)).toBe("beer");
  });

  it("export then import round-trips where you invest: https://example.com/isa stays set", async () => {
    const source = await storeWithFixture();
    await setInvestUrl(source, "https://example.com/isa");
    const json = await exportData(source);

    const target = new MemoryStore();
    await importData(target, json);

    expect(JSON.parse(json).settings).toEqual({ paydayDay: 20, investUrl: "https://example.com/isa" });
    expect((await target.getSettings()).investUrl).toBe("https://example.com/isa");
  });

  it("a file whose invest destination is javascript:alert(1) is rejected and the store is untouched", async () => {
    const store = await storeWithFixture();
    const broken = { ...FIXTURE, settings: { paydayDay: 20, investUrl: "javascript:alert(1)" } };

    await expect(importData(store, JSON.stringify(broken))).rejects.toThrow(
      "This file is not a Coffee Button export (where you invest must be an http or https link)",
    );

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });

  it("a file whose active item is not text is rejected and the store is untouched", async () => {
    const store = await storeWithFixture();
    const broken = { ...FIXTURE, settings: { paydayDay: 20, activeItemId: 7 } };

    await expect(importData(store, JSON.stringify(broken))).rejects.toThrow(
      "This file is not a Coffee Button export (active item must be an item id)",
    );

    expect(JSON.parse(await exportData(store))).toEqual(FIXTURE);
  });
});

describe("settings: export and import leave the Starling link on the phone (ticket 19)", () => {
  const LINK = {
    token: "secret-tok",
    relayUrl: "https://relay.example:8443",
    accountUid: "acc-1",
    spaceUid: "sg-1",
    spaceName: "Coffee Button",
  };

  it("exportData omits the starling field: no token, no Space uid in the file", async () => {
    const store = await storeWithFixture();
    await store.putSettings({ ...FIXTURE.settings, starling: LINK });

    const json = await exportData(store);

    expect(JSON.parse(json)).toEqual(FIXTURE);
    expect(json).not.toContain("secret-tok");
    expect(json).not.toContain("sg-1");
  });

  it("importData ignores a starling field in the file: a fresh phone stays unlinked, a linked phone keeps its own link", async () => {
    const planted = { ...FIXTURE, settings: { paydayDay: 20, starling: { ...LINK, token: "planted", spaceUid: "sg-x" } } };
    const fresh = new MemoryStore();
    const linked = new MemoryStore();
    await linked.putSettings({ paydayDay: 25, starling: LINK });

    await importData(fresh, JSON.stringify(planted));
    await importData(linked, JSON.stringify(planted));

    expect(await fresh.getSettings()).toEqual({ paydayDay: 20 });
    expect(await linked.getSettings()).toEqual({ paydayDay: 20, starling: LINK });
  });
});
