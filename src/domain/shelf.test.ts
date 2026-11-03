import { describe, expect, it } from "vitest";
import { shelfState } from "./shelf";

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
