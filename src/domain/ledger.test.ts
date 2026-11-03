import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
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
});
