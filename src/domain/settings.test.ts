import { describe, expect, it } from "vitest";
import { addItem } from "./settings";
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
});
