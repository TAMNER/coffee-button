import { describe, expect, it } from "vitest";
import { shelfItems, shelfState } from "./shelf";
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
});
