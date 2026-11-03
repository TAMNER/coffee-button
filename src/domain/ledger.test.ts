import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
import { setActiveItem } from "./settings";
import { MemoryStore } from "./store";

describe("Ledger", () => {
  it("captures the item's price at press time; repricing the item later leaves the press at £3.50", async () => {
    const store = new MemoryStore();
    await store.items.put({ id: "coffee", name: "Coffee", icon: "cup", pricePence: 350 });
    const ledger = new Ledger(store);

    const press = await ledger.addPress("coffee", new Date(2026, 10, 3, 9, 0));
    await store.items.put({ id: "coffee", name: "Coffee", icon: "cup", pricePence: 380 });

    expect(press.itemId).toBe("coffee");
    expect(press.pricePence).toBe(350);
    expect((await store.presses.get(press.id))?.pricePence).toBe(350);
  });

  it("monthToDate counts only presses in now's calendar month: 31 Oct 23:59 is out, 1 Nov 00:00 and 3 Nov are in", async () => {
    const store = new MemoryStore();
    await store.items.put({ id: "coffee", name: "Coffee", icon: "cup", pricePence: 350 });
    await store.items.put({ id: "beer", name: "Beer", icon: "pint", pricePence: 600 });
    const ledger = new Ledger(store);

    await ledger.addPress("coffee", new Date(2026, 9, 31, 23, 59));
    await ledger.addPress("coffee", new Date(2026, 10, 1, 0, 0));
    await ledger.addPress("beer", new Date(2026, 10, 3, 8, 30));
    await ledger.addPress("coffee", new Date(2025, 10, 3, 8, 30));

    expect(await ledger.monthToDate(new Date(2026, 10, 3, 12, 0))).toBe(950);
  });

  it("undo removes exactly that press, and undoing it a second time changes nothing", async () => {
    const store = new MemoryStore();
    await store.items.put({ id: "coffee", name: "Coffee", icon: "cup", pricePence: 350 });
    const ledger = new Ledger(store);
    const first = await ledger.addPress("coffee", new Date(2026, 10, 3, 9, 0));
    const second = await ledger.addPress("coffee", new Date(2026, 10, 3, 10, 0));

    await ledger.undo(second.id);
    await ledger.undo(second.id);

    expect((await store.presses.list()).map((p) => p.id)).toEqual([first.id]);
  });

  it("lifetime sums every press across months and years: 350 + 350 + 600 = 1300", async () => {
    const store = new MemoryStore();
    await store.items.put({ id: "coffee", name: "Coffee", icon: "cup", pricePence: 350 });
    await store.items.put({ id: "beer", name: "Beer", icon: "pint", pricePence: 600 });
    const ledger = new Ledger(store);
    await ledger.addPress("coffee", new Date(2025, 0, 15, 9, 0));
    await ledger.addPress("coffee", new Date(2026, 9, 31, 23, 59));
    await ledger.addPress("beer", new Date(2026, 10, 3, 18, 0));

    expect(await ledger.lifetime()).toBe(1300);
  });

  it("a press with no item records the active item at its price: switch to Beer, press, 600", async () => {
    const store = new MemoryStore();
    const ledger = new Ledger(store, () => "press-1");
    await setActiveItem(store, "beer");

    const press = await ledger.addPress(new Date(2026, 10, 3, 18, 0));

    expect(press).toEqual({ id: "press-1", itemId: "beer", pricePence: 600, at: new Date(2026, 10, 3, 18, 0).getTime() });
  });
});
