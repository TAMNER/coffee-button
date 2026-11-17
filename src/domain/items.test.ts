import { describe, expect, it } from "vitest";
import { ensureDefaultItems, listItems, nextItem, prevItem } from "./items";
import { removeItem } from "./settings";
import { MemoryStore } from "./store";

const coffee = { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 };
const beer = { id: "beer", name: "Beer", icon: "beer", pricePence: 600 };
const tea = { id: "tea", name: "Tea", icon: "cup", pricePence: 250 };

describe("item cycling", () => {
  it("nextItem steps forward in list order and wraps: coffee to beer, tea back to coffee", () => {
    expect(nextItem([coffee, beer, tea], "coffee")).toBe("beer");
    expect(nextItem([coffee, beer, tea], "tea")).toBe("coffee");
  });

  it("prevItem steps backward in list order and wraps: beer to coffee, coffee back to tea", () => {
    expect(prevItem([coffee, beer, tea], "beer")).toBe("coffee");
    expect(prevItem([coffee, beer, tea], "coffee")).toBe("tea");
  });

  it("with one item both directions return it", () => {
    expect(nextItem([coffee], "coffee")).toBe("coffee");
    expect(prevItem([coffee], "coffee")).toBe("coffee");
  });

  it("with an unknown active id both directions return the first item", () => {
    expect(nextItem([coffee, beer, tea], "gone")).toBe("coffee");
    expect(prevItem([coffee, beer, tea], "gone")).toBe("coffee");
  });
});

describe("ensureDefaultItems", () => {
  it("adds Lunch at 800 (icon sandwich) once, after Beer, to a store that has only Coffee and Beer", async () => {
    const store = new MemoryStore();
    await store.items.delete("lunch");

    await ensureDefaultItems(store);
    await ensureDefaultItems(store);

    expect(await listItems(store)).toEqual([
      { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 },
      { id: "beer", name: "Beer", icon: "beer", pricePence: 600 },
      { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 },
    ]);
  });

  it("adds Beer at 600 to a store that has only Coffee", async () => {
    const store = new MemoryStore();
    await store.items.delete("beer");

    await ensureDefaultItems(store);

    expect(await listItems(store)).toEqual([
      { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 },
      { id: "beer", name: "Beer", icon: "beer", pricePence: 600 },
      { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 },
    ]);
  });

  it("is a no-op when Beer exists: run twice, Beer repriced to 650 stays the one Beer", async () => {
    const store = new MemoryStore();
    await store.items.put({ id: "beer", name: "Beer", icon: "beer", pricePence: 650 });

    await ensureDefaultItems(store);
    await ensureDefaultItems(store);

    expect(await listItems(store)).toEqual([
      { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 },
      { id: "beer", name: "Beer", icon: "beer", pricePence: 650 },
      { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 },
    ]);
  });

  it("is a no-op when the user already added their own Beer under another id", async () => {
    const store = new MemoryStore();
    await store.items.delete("beer");
    await store.items.put({ id: "beer-1", name: "beer", icon: "pint", pricePence: 550 });

    await ensureDefaultItems(store);

    expect(await listItems(store)).toEqual([
      { id: "coffee", name: "Coffee", icon: "coffee", pricePence: 350 },
      { id: "lunch", name: "Lunch", icon: "sandwich", pricePence: 800 },
      { id: "beer-1", name: "beer", icon: "pint", pricePence: 550 },
    ]);
  });

  it("does not bring back Beer and Lunch once the user removed them (ticket 26): the removals are remembered", async () => {
    const store = new MemoryStore();
    await removeItem(store, "beer");
    await removeItem(store, "lunch");

    await ensureDefaultItems(store);

    expect(await listItems(store)).toEqual([coffee]);
    expect((await store.getSettings()).removedItemIds).toEqual(["beer", "lunch"]);
  });
});
