import { describe, expect, it } from "vitest";
import { addGoal, setShelfPrice, shelfItems, shelfState } from "./shelf";
import { MemoryStore } from "./store";

describe("shelfState", () => {
  it("with £500 lifetime the £400 espresso machine is lit and the £1000 laptop is half way", () => {
    const items = [
      { id: "espresso", name: "Espresso machine", pricePence: 40000 },
      { id: "laptop", name: "Laptop", pricePence: 100000 },
      { id: "exact", name: "Exactly reached", pricePence: 50000 },
    ];
    expect(shelfState(items, 50000)).toEqual([
      { id: "espresso", name: "Espresso machine", pricePence: 40000, lit: true, progress: 1 },
      { id: "laptop", name: "Laptop", pricePence: 100000, lit: false, progress: 0.5 },
      { id: "exact", name: "Exactly reached", pricePence: 50000, lit: true, progress: 1 },
    ]);
  });
});

describe("shelfItems", () => {
  it("a fresh store has the ten default items at their rough prices in pounds", async () => {
    const items = await shelfItems(new MemoryStore());
    expect(items.map((i) => [i.name, i.pricePence])).toEqual([
      ["Laptop", 100000],
      ["Ski week", 150000],
      ["Long-haul flight", 80000],
      ["Used car", 500000],
      ["Espresso machine", 40000],
      ["Bike", 60000],
      ["Weekend away", 30000],
      ["Phone", 90000],
      ["Camera", 70000],
      ["Festival ticket", 35000],
    ]);
  });

  it("repricing the laptop to £1200 is kept in settings and leaves payday and other items alone", async () => {
    const store = new MemoryStore();
    await setShelfPrice(store, "laptop", 120000);

    const items = await shelfItems(store);
    expect(items.find((i) => i.id === "laptop")?.pricePence).toBe(120000);
    expect(items.find((i) => i.id === "bike")?.pricePence).toBe(60000);
    expect((await store.getSettings()).paydayDay).toBe(25);
  });
});

describe("goals", () => {
  it("up to three goals are kept in the store; a fourth is rejected and not stored", async () => {
    const store = new MemoryStore();
    await addGoal(store, "Guitar", 45000);
    await addGoal(store, "Sofa", 80000);
    await addGoal(store, "Tent", 20000);

    await expect(addGoal(store, "Kayak", 70000)).rejects.toThrow();
    const goals = await store.goals.list();
    expect(goals.map((g) => [g.name, g.pricePence]).sort()).toEqual([
      ["Guitar", 45000],
      ["Sofa", 80000],
      ["Tent", 20000],
    ]);
  });
});
