import { describe, expect, it } from "vitest";
import { nextItem, prevItem } from "./items";

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
});
