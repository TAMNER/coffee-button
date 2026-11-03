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
});
